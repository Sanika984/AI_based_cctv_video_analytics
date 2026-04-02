from fastapi import FastAPI, Depends
from app.db.connection import SessionLocal
from app.models.footfall_log import FootfallLog
from app.models.heatmap_point import HeatmapPoint
from app.models.camera import Camera
from app.models.user import User   # if file name differs adjust
app = FastAPI()

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Root check
@app.get("/")
def root():
    return {"message": "Backend is running"}

# Footfall API
@app.get("/analytics/footfall")
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

# Heatmap API
@app.get("/analytics/heatmap")
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
    


@app.get("/cameras")
def get_cameras(db=Depends(get_db)):
    cams = db.query(Camera).all()
    return [
        {
            "camera_id": c.camera_id,
            "name": c.name,
            "location": c.location,
            "status": c.status
        }
        for c in cams
    ]

@app.get("/users")
def get_users(db=Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "user_id": u.user_id,
            "username": u.username,
            "role": u.role
        }
        for u in users
    ]