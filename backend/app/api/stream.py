import cv2
import numpy as np
import time
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

def generate_mock_frames():
    """
    Generator that yields MJPEG frames.
    Mocks an RTSP stream with ML inferences.
    """
    width, height = 640, 480
    frame_count = 0
    
    while True:
        # Create a dynamic mock image
        img = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Add some color shifting background to simulate dynamic video
        color_val = (frame_count * 5) % 255
        img[:] = (color_val, 50, 50)
        
        # Draw a moving bounding box to simulate ML inference
        box_x = (frame_count * 10) % (width - 100)
        box_y = 200 + int(50 * np.sin(frame_count * 0.2))
        
        # Bounding box (Person)
        cv2.rectangle(img, (box_x, box_y), (box_x + 100, box_y + 150), (163, 222, 78), 2)  # color #4EDEA3 roughly
        cv2.putText(img, "Person 89%", (box_x, box_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (163, 222, 78), 2)
        
        # Overlay timestamp
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(img, timestamp, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

        # Encode to JPEG
        ret, buffer = cv2.imencode('.jpg', img)
        frame = buffer.tobytes()

        # Yield frame in multipart format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
        frame_count += 1
        time.sleep(0.05) # ~20 FPS

@router.get("/{camera_id}")
def video_stream(camera_id: str):
    """
    Returns an MJPEG stream for a given camera ID.
    Consume this in React with: <img src="http://localhost:8000/stream/CAM-01" />
    """
    return StreamingResponse(
        generate_mock_frames(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
