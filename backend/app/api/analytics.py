from fastapi import APIRouter, Depends
from app.db.connection import SessionLocal
from app.models.footfall_log import FootfallLog
from app.models.heatmap_point import HeatmapPoint

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/footfall")
def get_footfall(db=Depends(get_db)):
    data = db.query(FootfallLog).limit(100).all()
    return [
        {
            "log_id": d.log_id,
            "camera_id": d.camera_id,
            "count": d.count,
            "timestamp": d.timestamp
        }
        for d in data
    ]

@router.get("/heatmap")
def get_heatmap(db=Depends(get_db)):
    data = db.query(HeatmapPoint).limit(200).all()
    return [
        {
            "id": d.id,
            "camera_id": d.camera_id,
            "x": d.x_normalized,
            "y": d.y_normalized,
            "timestamp": d.timestamp
        }
        for d in data
    ]
