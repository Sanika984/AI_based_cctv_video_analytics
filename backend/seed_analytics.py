# backend/seed_analytics.py

from app.db.connection import SessionLocal
from app.models.footfall_log import FootfallLog
from app.models.heatmap_point import HeatmapPoint
from app.models.camera import Camera
from datetime import datetime, timedelta
import uuid
import random

db = SessionLocal()

# Seed Cameras
camera_data = [
    {"id": "cam_1", "name": "MAIN ENTRANCE", "location": "Zone A", "status": "online"},
    {"id": "cam_2", "name": "EXIT 01", "location": "Zone A", "status": "online"},
    {"id": "cam_3", "name": "WEST ENTRANCE", "location": "Zone B", "status": "online"},
    {"id": "cam_4", "name": "EXIT 02", "location": "Zone B", "status": "maintenance"},
    {"id": "cam_5", "name": "CHECKOUT", "location": "Zone C", "status": "online"},
    {"id": "cam_12", "name": "AISLE 3", "location": "Zone C", "status": "online"},
    {"id": "cam_18", "name": "PARKING LOT", "location": "Exterior", "status": "offline"},
    {"id": "cam_19", "name": "LOADING DOCK", "location": "Exterior", "status": "online"},
]

for c in camera_data:
    # Check if exists to avoid unique constraint errors if ran multiple times
    existing = db.query(Camera).filter(Camera.camera_id == c["id"]).first()
    if not existing:
        cam = Camera(
            camera_id=c["id"],
            name=c["name"],
            location=c["location"],
            source=f"rtsp://10.0.0.{random.randint(10, 99)}/stream1",
            status=c["status"],
            created_at=datetime.now() - timedelta(days=random.randint(1, 30))
        )
        db.add(cam)

# Footfall data
for i in range(50):
    log = FootfallLog(
        log_id=str(uuid.uuid4()),
        camera_id="cam_1",
        count=random.randint(5, 25),
        timestamp=datetime.now() - timedelta(minutes=i * 5)
    )
    db.add(log)

# Heatmap data
for _ in range(200):
    point = HeatmapPoint(
        id=str(uuid.uuid4()),
        camera_id="cam_1",
        x_normalized=random.random(),
        y_normalized=random.random(),
        timestamp=datetime.now()
    )
    db.add(point)

db.commit()
print("Seeded data successfully!")