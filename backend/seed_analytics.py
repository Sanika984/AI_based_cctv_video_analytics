# backend/seed_analytics.py

from app.db.connection import SessionLocal
from app.models.footfall_log import FootfallLog
from app.models.heatmap_point import HeatmapPoint
from datetime import datetime, timedelta
import uuid
import random

db = SessionLocal()

# Footfall data
for i in range(50):
    log = FootfallLog(
        log_id=str(uuid.uuid4()),
        camera_id="cam_1",
        count=random.randint(5, 25),
        timestamp=datetime.now() - timedelta(minutes=i * 10)
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
print("Seeded data")