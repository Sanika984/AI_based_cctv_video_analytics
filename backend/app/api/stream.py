import io
from ultralytics import YOLO
import cv2
import numpy as np
import time
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.db.connection import SessionLocal
from app.models.camera import Camera
from app.models.camera_in_out_config import CameraInOutConfig
from app.models.in_out_log import InOutLog
from app.schemas.camera import SnapshotRequest

router = APIRouter()

@router.post("/snapshot")
def get_snapshot(payload: SnapshotRequest):
    source_url = payload.sourceUrl
    
    # Handle demo video requests
    if source_url.startswith("demo://"):
        # map demo url to local video file
        base_path = os.getcwd()
        if "videos/p.mp4" in source_url:
            source_url = os.path.join(base_path, "videos/p.mp4")
        else:
            source_url = os.path.join(base_path, "videos/p.mp4") # Default demo
            
    cap = cv2.VideoCapture(source_url)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not connect to camera stream")
    
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        raise HTTPException(status_code=500, detail="Could not read frame from camera")
    
    _, buffer = cv2.imencode('.jpg', frame)
    return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/jpeg")


# Load YOLO model
model = YOLO("yolov8n.pt") 

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_line_side(p, a, b):
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])

def sync_to_db(camera_id: str, is_in: bool):
    db = SessionLocal()
    try:
        now = datetime.now()
        current_hour = now.replace(minute=0, second=0, microsecond=0)
        log = db.query(InOutLog).filter(InOutLog.camera_id == camera_id, InOutLog.timestamp == current_hour).first()
        if log:
            if is_in: log.in_count += 1
            else: log.out_count += 1
        else:
            db.add(InOutLog(camera_id=camera_id, in_count=1 if is_in else 0, out_count=1 if not is_in else 0, timestamp=current_hour))
        db.commit()
    except Exception as e:
        print(f"Error syncing to DB: {e}")
        db.rollback()
    finally:
        db.close()

def generate_counting_frames(video_path: str, p1, p2, in_side_orient, camera_id: str):
    cap = cv2.VideoCapture(video_path)
    track_history = {}
    counted_ids = set()
    session_in = 0
    session_out = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        
        # Get REAL original dimensions
        orig_h, orig_w = frame.shape[:2]
        
        # Resize for display/processing consistency
        display_w = 800
        display_h = int(orig_h * (display_w / orig_w))
        frame = cv2.resize(frame, (display_w, display_h))
        
        # SCALE POINTS: The points in DB are for the original resolution (from LineSetupModal)
        scale_w = display_w / orig_w
        scale_h = display_h / orig_h
        
        line_p1 = (int(p1[0] * scale_w), int(p1[1] * scale_h))
        line_p2 = (int(p2[0] * scale_w), int(p2[1] * scale_h))

        results = model.track(frame, persist=True, classes=[0], verbose=False)

        if results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            ids = results[0].boxes.id.cpu().numpy()

            for box, track_id in zip(boxes, ids):
                track_id = int(track_id)
                x1, y1, x2, y2 = map(int, box)
                cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)

                if track_id not in track_history:
                    track_history[track_id] = []
                track_history[track_id].append((cx, cy))
                if len(track_history[track_id]) > 2: track_history[track_id].pop(0)

                if len(track_history[track_id]) == 2 and track_id not in counted_ids:
                    prev_p, curr_p = track_history[track_id][0], track_history[track_id][1]
                    prev_side = get_line_side(prev_p, line_p1, line_p2)
                    curr_side = get_line_side(curr_p, line_p1, line_p2)

                    if prev_side * curr_side < 0:
                        is_in = False
                        if curr_side > 0:
                            if in_side_orient > 0: session_in += 1; is_in = True
                            else: session_out += 1
                        else:
                            if in_side_orient < 0: session_in += 1; is_in = True
                            else: session_out += 1
                        counted_ids.add(track_id)
                        sync_to_db(camera_id, is_in)

                cv2.rectangle(frame, (x1, y1), (x2, y2), (78, 222, 163), 2)

        # Draw Line
        cv2.line(frame, line_p1, line_p2, (0, 255, 255), 4)
        
        # Visual Indicators
        cv2.putText(frame, f"IN: {session_in}", (30, 50), cv2.FONT_HERSHEY_DUPLEX, 1.0, (78, 222, 163), 2)
        cv2.putText(frame, f"OUT: {session_out}", (30, 100), cv2.FONT_HERSHEY_DUPLEX, 1.0, (238, 125, 119), 2)
        cv2.putText(frame, "AI ANALYTICS ACTIVE", (display_w - 250, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        time.sleep(0.04)

@router.get("/{camera_id}")
def video_stream(camera_id: str, db=Depends(get_db)):
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera or not camera.source:
        return StreamingResponse(generate_mock_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

    source = camera.source.strip()
    clean_source = source.replace("demo://", "").strip()
    if clean_source.startswith("/"): clean_source = clean_source[1:]

    possible_paths = [
        clean_source,
        os.path.join(os.getcwd(), clean_source),
        os.path.join(os.getcwd(), "backend", clean_source),
        os.path.join(os.path.dirname(__file__), "..", "..", clean_source),
        os.path.join(os.path.dirname(__file__), "..", "..", "videos", os.path.basename(clean_source)),
    ]
    
    video_path = next((os.path.abspath(p) for p in possible_paths if os.path.exists(os.path.abspath(p))), None)
    
    if video_path:
        config = db.query(CameraInOutConfig).filter(CameraInOutConfig.camera_id == camera_id).first()
        if config:
            return StreamingResponse(
                generate_counting_frames(video_path, (config.p1_x, config.p1_y), (config.p2_x, config.p2_y), config.in_side, camera_id),
                media_type="multipart/x-mixed-replace; boundary=frame"
            )
        return StreamingResponse(generate_simple_file_frames(video_path), media_type="multipart/x-mixed-replace; boundary=frame")

    return StreamingResponse(generate_mock_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

def generate_simple_file_frames(video_path):
    cap = cv2.VideoCapture(video_path)
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        h, w = frame.shape[:2]
        display_w = 800
        display_h = int(h * (display_w / w))
        frame = cv2.resize(frame, (display_w, display_h))
        cv2.putText(frame, "SIMPLE FEED (NO CONFIG)", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        time.sleep(0.04)

def generate_mock_frames():
    width, height = 640, 480
    frame_count = 0
    while True:
        img = np.zeros((height, width, 3), dtype=np.uint8)
        img[:] = (20, 20, 30)
        box_x = (frame_count * 10) % (640 - 100)
        cv2.rectangle(img, (box_x, 200), (box_x + 100, 350), (78, 222, 163), 2)
        cv2.putText(img, "NO CAMERA FOUND", (200, 240), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        ret, buffer = cv2.imencode('.jpg', img)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        frame_count += 1
        time.sleep(0.05)
