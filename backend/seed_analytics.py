# backend/seed_analytics.py

from app.db.connection import SessionLocal
from app.models.footfall_log import FootfallLog
from app.models.heatmap_point import HeatmapPoint
from app.models.camera import Camera
from app.models.camera_metadata import CameraMetadata
from app.models.camera_module import CameraModule
from app.models.camera_feature import CameraFeature
from app.models.in_out_log import InOutLog
from app.models.camera_in_out_config import CameraInOutConfig
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
    
    # Entrance cameras will use the demo video
    if "ENTRANCE" in c["name"] or "EXIT" in c["name"]:
        source = "videos/p.mp4"
    else:
        source = f"rtsp://10.0.0.{random.randint(10, 99)}/stream1"

    if not existing:
        cam = Camera(
            camera_id=c["id"],
            name=c["name"],
            location=c["location"],
            source=source,
            status=c["status"],
            created_at=datetime.now() - timedelta(days=random.randint(1, 30))
        )
        db.add(cam)
    else:
        # Update source of existing cameras to ensure they use the video
        existing.source = source
    
    # Ensure Consumer Analytics module is enabled
    existing_module = db.query(CameraModule).filter(
        CameraModule.camera_id == c["id"], 
        CameraModule.module_name == "Consumer Analytics"
    ).first()
    if not existing_module:
        db.add(CameraModule(camera_id=c["id"], module_name="Consumer Analytics"))
    
    # Ensure IN / OUT count feature is enabled
    if "ENTRANCE" in c["name"] or "EXIT" in c["name"]:
        existing_feat = db.query(CameraFeature).filter(
            CameraFeature.camera_id == c["id"],
            CameraFeature.feature_name == "IN / OUT count"
        ).first()
        if not existing_feat:
            db.add(CameraFeature(camera_id=c["id"], feature_name="IN / OUT count", is_enabled=True))
        else:
            existing_feat.is_enabled = True

# Seed Camera Metadata (Floors)
camera_floors = {
    "cam_1": "Floor 0 - Entrance",
    "cam_2": "Floor 0 - Entrance",
    "cam_3": "Floor 1 - Furniture",
    "cam_4": "Floor 1 - Furniture",
    "cam_5": "Floor 0 - Checkout Zone",
    "cam_12": "Floor 2 - Home Appliances",
    "cam_19": "Floor 0 - Loading",
}

for cam_id, floor in camera_floors.items():
    existing_meta = db.query(CameraMetadata).filter(CameraMetadata.camera_id == cam_id).first()
    if not existing_meta:
        meta = CameraMetadata(camera_id=cam_id, floor=floor)
        db.add(meta)

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

# In/Out Log data (Keep Yesterday for comparison, Live will sync Today)
now = datetime.now()
for cam_id in ["cam_1", "cam_2", "cam_3", "cam_5", "cam_12"]:
    # SKIP Today's dummy data to show LIVE counting
    # for h in range(now.hour + 1): ...
    
    # Yesterday's data (daily summary mock)
    yesterday = now - timedelta(days=1)
    for h in range(24):
        log_time = yesterday.replace(hour=h, minute=0, second=0, microsecond=0)
        log = InOutLog(
            camera_id=cam_id,
            in_count=random.randint(8, 45),
            out_count=random.randint(4, 38),
            timestamp=log_time
        )
        db.add(log)

# Seed In-Out Configs for all Entrance/Exit cameras
all_cams = db.query(Camera).all()
for c in all_cams:
    if "ENTRANCE" in c.name or "EXIT" in c.name:
        existing_config = db.query(CameraInOutConfig).filter(CameraInOutConfig.camera_id == c.camera_id).first()
        if not existing_config:
            config = CameraInOutConfig(
                camera_id=c.camera_id,
                p1_x=100, p1_y=240,
                p2_x=540, p2_y=240,
                in_side=1
            )
            db.add(config)

db.commit()
print("Seeded data successfully!")