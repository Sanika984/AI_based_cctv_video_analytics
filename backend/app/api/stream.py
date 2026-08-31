import io
import asyncio
from ultralytics import YOLO
import cv2
import numpy as np
import time
import os
from typing import Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.db.connection import SessionLocal
from app.models.camera import Camera
from app.models.camera_in_out_config import CameraInOutConfig
from app.models.in_out_log import InOutLog
from app.schemas.camera import SnapshotRequest

router = APIRouter()

class StreamManager:
    def __init__(self):
        self._active_events: Dict[str, asyncio.Event] = {}

    def get_or_create_stop_event(self, key: str) -> asyncio.Event:
        if key in self._active_events:
            self._active_events[key].set()
        ev = asyncio.Event()
        self._active_events[key] = ev
        return ev

    def stop_stream(self, key: str):
        if key in self._active_events:
            self._active_events[key].set()
            try:
                del self._active_events[key]
            except KeyError:
                pass

    def stop_all(self):
        for ev in list(self._active_events.values()):
            ev.set()
        self._active_events.clear()

stream_manager = StreamManager()

def resolve_source_path(source: str):
    if source is None:
        return source
    clean = str(source).strip()
    if clean.startswith(("rtsp://", "http://", "https://")):
        return clean
    if clean.isdigit():
        return int(clean)
    
    clean_path = clean.replace("demo://", "").strip()
    if clean_path.startswith("/"):
        clean_path = clean_path[1:]
    filename = os.path.basename(clean_path)
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    possible_paths = [
        clean_path,
        os.path.join(os.getcwd(), clean_path),
        os.path.join(os.getcwd(), "data", clean_path),
        os.path.join(os.getcwd(), "data", "videos", filename),
        os.path.join(os.getcwd(), "backend", clean_path),
        os.path.join(os.getcwd(), "backend", "data", "videos", filename),
        os.path.join(base_dir, clean_path),
        os.path.join(base_dir, "data", "videos", filename),
        os.path.join(base_dir, "videos", filename),
    ]
    
    return next((os.path.abspath(p) for p in possible_paths if os.path.exists(os.path.abspath(p))), clean_path)

def get_source_type_label(source_val):
    if isinstance(source_val, int):
        return "Webcam"
    if isinstance(source_val, str):
        if source_val.startswith(("rtsp://", "http://", "https://")):
            return "Network Stream (RTSP/HTTP)"
        if os.path.exists(source_val):
            return "Local Video File"
    return "Custom Source"

@router.post("/test")
def test_stream_connection(payload: SnapshotRequest):
    source_url = resolve_source_path(payload.sourceUrl)
    if source_url is None or str(source_url).strip() == "":
        raise HTTPException(status_code=400, detail="Source URL is required")
        
    cap = None
    try:
        cap = cv2.VideoCapture(source_url)
        if not cap.isOpened():
            return {
                "success": False,
                "message": f"Could not connect to camera source ({payload.sourceUrl}). Please verify the address, device index, or file path."
            }
        
        ret, frame = cap.read()
        if not ret or frame is None:
            return {
                "success": False,
                "message": "Connected to camera source, but failed to capture frame."
            }
        
        h, w = frame.shape[:2]
        source_fps = float(cap.get(cv2.CAP_PROP_FPS))
        if source_fps <= 0 or source_fps != source_fps or source_fps > 120:
            source_fps = 30.0

        source_type = get_source_type_label(source_url)
        return {
            "success": True,
            "message": "Stream active and verified",
            "resolution": f"{w}x{h}",
            "fps": round(source_fps, 1),
            "sourceType": source_type
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Stream connection failed: {str(e)}"
        }
    finally:
        if cap is not None:
            cap.release()

@router.post("/snapshot")
def get_snapshot(payload: SnapshotRequest):
    source_url = resolve_source_path(payload.sourceUrl)
    cap = None
    try:
        cap = cv2.VideoCapture(source_url)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not connect to camera stream")
        
        ret, frame = cap.read()
        if not ret:
            raise HTTPException(status_code=500, detail="Could not read frame from camera")
        
        _, buffer = cv2.imencode('.jpg', frame)
        return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/jpeg")
    finally:
        if cap is not None:
            cap.release()

@router.post("/stop")
def stop_stream_endpoint(payload: dict = None):
    if payload and "key" in payload:
        stream_manager.stop_stream(payload["key"])
    elif payload and "camera_id" in payload:
        stream_manager.stop_stream(f"cam_{payload['camera_id']}")
    else:
        stream_manager.stop_all()
    return {"message": "Stream stopped successfully"}

@router.get("/stats")
def get_stream_stats():
    from app.services.video_ingestion import ingestion_manager
    return ingestion_manager.get_status()

@router.get("/preview")
async def preview_stream(source: str, request: Request):
    resolved = resolve_source_path(source)
    stop_event = stream_manager.get_or_create_stop_event(f"preview_{source}")
    if resolved is None:
        return StreamingResponse(
            generate_mock_frames("NO SOURCE", request, stop_event),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )
    
    return StreamingResponse(
        generate_preview_frames(resolved, request, stop_event),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

async def generate_preview_frames(source_resolved, request: Request, stop_event: asyncio.Event):
    cap = await asyncio.to_thread(cv2.VideoCapture, source_resolved)

    try:
        if not cap.isOpened():
            async for chunk in generate_mock_frames("UNABLE TO CONNECT", request, stop_event):
                yield chunk
            return

        source_fps = float(cap.get(cv2.CAP_PROP_FPS))
        if source_fps <= 0 or source_fps != source_fps or source_fps > 120:
            source_fps = 30.0
        frame_interval = 1.0 / source_fps
        is_file = isinstance(source_resolved, str) and os.path.exists(source_resolved)

        while not stop_event.is_set():
            if await request.is_disconnected():
                break

            start_t = time.monotonic()
            ret, frame = await asyncio.to_thread(cap.read)
            if not ret or frame is None:
                if is_file:
                    await asyncio.to_thread(cap.set, cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    await asyncio.sleep(0.05)
                    continue

            h, w = frame.shape[:2]
            display_w = 640
            display_h = int(h * (display_w / w)) if w > 0 else 360
            frame = cv2.resize(frame, (display_w, display_h))
            
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if not ret:
                continue
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

            # Real-time clock pacing
            elapsed = time.monotonic() - start_t
            sleep_time = max(0.001, frame_interval - elapsed) if is_file else 0.01
            await asyncio.sleep(sleep_time)
    except (asyncio.CancelledError, GeneratorExit, Exception):
        pass
    finally:
        await asyncio.to_thread(cap.release)

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

async def generate_counting_frames(video_path, p1, p2, in_side_orient, camera_id: str, request: Request, stop_event: asyncio.Event):
    cap = await asyncio.to_thread(cv2.VideoCapture, video_path)
    track_history = {}
    counted_ids = set()
    session_in = 0
    session_out = 0

    try:
        if not cap.isOpened():
            async for chunk in generate_mock_frames("UNABLE TO CONNECT", request, stop_event):
                yield chunk
            return

        source_fps = float(cap.get(cv2.CAP_PROP_FPS))
        if source_fps <= 0 or source_fps != source_fps or source_fps > 120:
            source_fps = 30.0
        frame_interval = 1.0 / source_fps
        is_file = isinstance(video_path, str) and os.path.exists(video_path)

        while not stop_event.is_set():
            if await request.is_disconnected():
                break

            start_t = time.monotonic()
            ret, frame = await asyncio.to_thread(cap.read)
            if not ret or frame is None:
                if is_file:
                    await asyncio.to_thread(cap.set, cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    await asyncio.sleep(0.05)
                    continue

            # Get REAL original dimensions
            orig_h, orig_w = frame.shape[:2]
            
            # Resize for display/processing consistency
            display_w = 800
            display_h = int(orig_h * (display_w / orig_w)) if orig_w > 0 else 450
            frame = cv2.resize(frame, (display_w, display_h))
            
            # SCALE POINTS: The points in DB are for the original resolution (from LineSetupModal)
            scale_w = display_w / orig_w if orig_w > 0 else 1
            scale_h = display_h / orig_h if orig_h > 0 else 1
            
            line_p1 = (int(p1[0] * scale_w), int(p1[1] * scale_h))
            line_p2 = (int(p2[0] * scale_w), int(p2[1] * scale_h))

            results = await asyncio.to_thread(model.track, frame, persist=True, classes=[0], verbose=False)

            if results and len(results) > 0 and results[0].boxes is not None and results[0].boxes.id is not None:
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
                            await asyncio.to_thread(sync_to_db, camera_id, is_in)

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (78, 222, 163), 2)

            # Draw Line
            cv2.line(frame, line_p1, line_p2, (0, 255, 255), 3)
            
            # Clean Visual Indicators
            cv2.putText(frame, f"IN: {session_in}", (30, 45), cv2.FONT_HERSHEY_DUPLEX, 0.9, (78, 222, 163), 2)
            cv2.putText(frame, f"OUT: {session_out}", (30, 85), cv2.FONT_HERSHEY_DUPLEX, 0.9, (238, 125, 119), 2)

            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
            # Real-time clock pacing
            elapsed = time.monotonic() - start_t
            sleep_time = max(0.001, frame_interval - elapsed) if is_file else 0.01
            await asyncio.sleep(sleep_time)
    except (asyncio.CancelledError, GeneratorExit, Exception):
        pass
    finally:
        await asyncio.to_thread(cap.release)

@router.get("/{camera_id}")
async def video_stream(camera_id: str, request: Request, db=Depends(get_db)):
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    stop_event = stream_manager.get_or_create_stop_event(f"cam_{camera_id}")
    if not camera or not camera.source:
        return StreamingResponse(
            generate_mock_frames("NO CAMERA FOUND", request, stop_event),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )

    resolved_source = resolve_source_path(camera.source)
    video_path = resolved_source if (isinstance(resolved_source, int) or (isinstance(resolved_source, str) and (os.path.exists(resolved_source) or resolved_source.startswith(('rtsp://', 'http://', 'https://'))))) else None
    
    if video_path is not None:
        config = db.query(CameraInOutConfig).filter(CameraInOutConfig.camera_id == camera_id).first()
        if config:
            return StreamingResponse(
                generate_counting_frames(video_path, (config.p1_x, config.p1_y), (config.p2_x, config.p2_y), config.in_side, camera_id, request, stop_event),
                media_type="multipart/x-mixed-replace; boundary=frame"
            )
        return StreamingResponse(
            generate_simple_file_frames(video_path, request, stop_event, camera_id=camera_id),
            media_type="multipart/x-mixed-replace; boundary=frame"
        )

    return StreamingResponse(
        generate_mock_frames("CAMERA OFFLINE", request, stop_event),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

async def generate_simple_file_frames(video_path, request: Request, stop_event: asyncio.Event, camera_id: str = None):
    cap = await asyncio.to_thread(cv2.VideoCapture, video_path)
    from app.services.fire_detection import security_cache
    from app.services.weapon_detection import weapon_cache
    from app.services.license_plate_detection import license_plate_cache

    try:
        if not cap.isOpened():
            async for chunk in generate_mock_frames("UNABLE TO CONNECT", request, stop_event):
                yield chunk
            return

        source_fps = float(cap.get(cv2.CAP_PROP_FPS))
        if source_fps <= 0 or source_fps != source_fps or source_fps > 120:
            source_fps = 30.0
        frame_interval = 1.0 / source_fps
        is_file = isinstance(video_path, str) and os.path.exists(video_path)

        while not stop_event.is_set():
            if await request.is_disconnected():
                break

            start_t = time.monotonic()
            ret, frame = await asyncio.to_thread(cap.read)
            if not ret or frame is None:
                if is_file:
                    await asyncio.to_thread(cap.set, cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    await asyncio.sleep(0.05)
                    continue

            h, w = frame.shape[:2]
            display_w = 800
            display_h = int(h * (display_w / w)) if w > 0 else 450
            frame = cv2.resize(frame, (display_w, display_h))
            
            # Check security states for live threat detection visual overlays
            if camera_id:
                scale_x = display_w / w if w > 0 else 1.0
                scale_y = display_h / h if h > 0 else 1.0

                # 1. Fire Detection Overlay
                fire_state = security_cache.get_camera_state(camera_id)
                if fire_state and fire_state.get("fire_detected"):
                    for box in fire_state.get("boxes", []):
                        bx1, by1, bx2, by2 = int(box[0] * scale_x), int(box[1] * scale_y), int(box[2] * scale_x), int(box[3] * scale_y)
                        cv2.rectangle(frame, (bx1, by1), (bx2, by2), (0, 69, 255), 2)
                        cv2.putText(frame, "FIRE DETECTED", (bx1, max(18, by1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 69, 255), 2)

                    if fire_state.get("is_active_alert"):
                        cv2.rectangle(frame, (display_w - 220, 15), (display_w - 20, 50), (0, 0, 180), -1)
                        cv2.putText(frame, "CRITICAL FIRE ALERT", (display_w - 210, 38), cv2.FONT_HERSHEY_DUPLEX, 0.5, (255, 255, 255), 1)

                # 2. Weapon Detection Overlay
                weapon_state = weapon_cache.get_camera_state(camera_id)
                if weapon_state and weapon_state.get("weapon_detected"):
                    threat_cls = weapon_state.get("threat_class", "Gun").upper()
                    conf_pct = int(weapon_state.get("confidence", 0.0) * 100)
                    for box in weapon_state.get("boxes", []):
                        bx1, by1, bx2, by2 = int(box[0] * scale_x), int(box[1] * scale_y), int(box[2] * scale_x), int(box[3] * scale_y)
                        # Amber / Gold bounding box for weapons (BGR: 0, 165, 255)
                        cv2.rectangle(frame, (bx1, by1), (bx2, by2), (0, 165, 255), 2)
                        label_txt = f"WEAPON: {threat_cls} ({conf_pct}%)" if conf_pct > 0 else f"WEAPON: {threat_cls}"
                        cv2.putText(frame, label_txt, (bx1, max(18, by1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)

                    if weapon_state.get("is_active_alert"):
                        top_offset = 55 if (fire_state and fire_state.get("is_active_alert")) else 15
                        cv2.rectangle(frame, (display_w - 245, top_offset), (display_w - 20, top_offset + 35), (0, 140, 255), -1)
                        cv2.putText(frame, "CRITICAL WEAPON ALERT", (display_w - 235, top_offset + 23), cv2.FONT_HERSHEY_DUPLEX, 0.5, (255, 255, 255), 1)

                # 3. License Plate Detection Overlay
                lpd_state = license_plate_cache.get_camera_state(camera_id)
                if lpd_state and lpd_state.get("plate_detected"):
                    plate_txt = lpd_state.get("plate_number") or "PLATE"
                    is_bl = lpd_state.get("is_blacklisted", False)
                    conf_pct = int(lpd_state.get("confidence", 0.0) * 100)
                    box_color = (0, 0, 255) if is_bl else (78, 222, 163) # Red if blacklisted, emerald if normal
                    
                    for box in lpd_state.get("boxes", []):
                        bx1, by1, bx2, by2 = int(box[0] * scale_x), int(box[1] * scale_y), int(box[2] * scale_x), int(box[3] * scale_y)
                        cv2.rectangle(frame, (bx1, by1), (bx2, by2), box_color, 2)
                        
                        # Label background
                        lbl = f"{'[BLACKLIST] ' if is_bl else ''}{plate_txt} ({conf_pct}%)" if conf_pct > 0 else plate_txt
                        (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                        cv2.rectangle(frame, (bx1, max(0, by1 - 22)), (bx1 + tw + 10, max(20, by1)), (0, 20, 50), -1)
                        cv2.putText(frame, lbl, (bx1 + 5, max(15, by1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, box_color, 1)

                    if is_bl:
                        cv2.rectangle(frame, (display_w - 265, 15), (display_w - 20, 50), (0, 0, 200), -1)
                        cv2.putText(frame, "BLACKLIST DETECTED", (display_w - 255, 38), cv2.FONT_HERSHEY_DUPLEX, 0.5, (255, 255, 255), 1)

            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
            # Real-time clock pacing
            elapsed = time.monotonic() - start_t
            sleep_time = max(0.001, frame_interval - elapsed) if is_file else 0.01
            await asyncio.sleep(sleep_time)
    except (asyncio.CancelledError, GeneratorExit, Exception):
        pass
    finally:
        await asyncio.to_thread(cap.release)

async def generate_mock_frames(label="NO CAMERA FOUND", request: Request = None, stop_event: asyncio.Event = None):
    width, height = 640, 480
    frame_count = 0
    try:
        while True:
            if request and await request.is_disconnected():
                break
            if stop_event and stop_event.is_set():
                break
            img = np.zeros((height, width, 3), dtype=np.uint8)
            img[:] = (20, 20, 30)
            box_x = (frame_count * 10) % (640 - 100)
            cv2.rectangle(img, (box_x, 200), (box_x + 100, 350), (78, 222, 163), 2)
            cv2.putText(img, label, (180, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
            ret, buffer = cv2.imencode('.jpg', img)
            if not ret:
                continue
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            frame_count += 1
            await asyncio.sleep(0.05)
    except (asyncio.CancelledError, GeneratorExit, Exception):
        pass

