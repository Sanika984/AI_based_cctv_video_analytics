from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
import uuid
from app.db.connection import SessionLocal
from app.models.camera import Camera
from app.models.camera_metadata import CameraMetadata
from app.models.camera_module import CameraModule
from app.models.camera_feature import CameraFeature
from app.models.camera_in_out_config import CameraInOutConfig
from fastapi.responses import StreamingResponse
import cv2
import io

class InOutConfig(BaseModel):
    p1_x: int
    p1_y: int
    p2_x: int
    p2_y: int
    in_side: int

class CameraCreate(BaseModel):
    name: str
    location: str
    sourceUrl: str
    floor: Optional[str] = None
    description: Optional[str] = None
    module: str
    features: Dict[str, bool]
    status: str
    inOutConfig: Optional[InOutConfig] = None

class SnapshotRequest(BaseModel):
    sourceUrl: str

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_cameras(db=Depends(get_db)):
    cams = db.query(Camera).all()
    result = []
    for c in cams:
        module_name = c.modules[0].module_name if c.modules else "Consumer Analytics"
        features_dict = {f.feature_name: f.is_enabled for f in c.features} if c.features else {}
        
        in_out_data = None
        if c.in_out_config:
            in_out_data = {
                "p1_x": c.in_out_config.p1_x,
                "p1_y": c.in_out_config.p1_y,
                "p2_x": c.in_out_config.p2_x,
                "p2_y": c.in_out_config.p2_y,
                "in_side": c.in_out_config.in_side
            }

        result.append({
            "camera_id": c.camera_id,
            "name": c.name,
            "location": c.location,
            "status": c.status,
            "sourceUrl": c.source,
            "date": c.created_at.strftime("%b %d, %Y, %I:%M:%S %p") if c.created_at else "",
            "desc": (c.metadata_info.description if c.metadata_info and c.metadata_info.description else "No description available"),
            "floor": (c.metadata_info.floor if c.metadata_info and c.metadata_info.floor else "Unknown"),
            "module": module_name,
            "features": features_dict,
            "inOutConfig": in_out_data
        })
    return result

@router.post("/snapshot")
def get_snapshot(payload: SnapshotRequest):
    source_url = payload.sourceUrl
    
    # Handle demo video requests
    if source_url.startswith("demo://"):
        # map demo url to local video file
        import os
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

@router.post("/", status_code=201)
def create_camera(payload: CameraCreate, db=Depends(get_db)):
    try:
        camera_id = str(uuid.uuid4())
        new_camera = Camera(
            camera_id=camera_id,
            name=payload.name,
            location=payload.location,
            source=payload.sourceUrl,
            status=payload.status,
            created_at=datetime.utcnow()
        )
        db.add(new_camera)
        
        # Add Metadata
        new_metadata = CameraMetadata(
            camera_id=camera_id,
            floor=payload.floor,
            description=payload.description
        )
        db.add(new_metadata)

        # Add Module
        new_module = CameraModule(
            camera_id=camera_id,
            module_name=payload.module
        )
        db.add(new_module)

        # Add Features
        if payload.features:
            for feat_name, is_enabled in payload.features.items():
                db.add(CameraFeature(
                    camera_id=camera_id,
                    feature_name=feat_name,
                    is_enabled=is_enabled
                ))
        
        # Add InOut Config
        if payload.inOutConfig:
            db.add(CameraInOutConfig(
                camera_id=camera_id,
                p1_x=payload.inOutConfig.p1_x,
                p1_y=payload.inOutConfig.p1_y,
                p2_x=payload.inOutConfig.p2_x,
                p2_y=payload.inOutConfig.p2_y,
                in_side=payload.inOutConfig.in_side
            ))

        db.commit()
        return {"message": "Camera created successfully", "camera_id": camera_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{camera_id}", status_code=204)
def delete_camera(camera_id: str, db=Depends(get_db)):
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    try:
        db.delete(camera)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{camera_id}", status_code=200)
def update_camera(camera_id: str, payload: CameraCreate, db=Depends(get_db)):
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    try:
        camera.name = payload.name
        camera.location = payload.location
        camera.source = payload.sourceUrl
        camera.status = payload.status
        
        if camera.metadata_info:
            camera.metadata_info.floor = payload.floor
            camera.metadata_info.description = payload.description
        else:
            db.add(CameraMetadata(camera_id=camera_id, floor=payload.floor, description=payload.description))

        db.query(CameraModule).filter(CameraModule.camera_id == camera_id).delete()
        db.add(CameraModule(camera_id=camera_id, module_name=payload.module))

        db.query(CameraFeature).filter(CameraFeature.camera_id == camera_id).delete()
        if payload.features:
            for feat_name, is_enabled in payload.features.items():
                db.add(CameraFeature(camera_id=camera_id, feature_name=feat_name, is_enabled=is_enabled))
        
        # Update InOut Config
        db.query(CameraInOutConfig).filter(CameraInOutConfig.camera_id == camera_id).delete()
        if payload.inOutConfig:
            db.add(CameraInOutConfig(
                camera_id=camera_id,
                p1_x=payload.inOutConfig.p1_x,
                p1_y=payload.inOutConfig.p1_y,
                p2_x=payload.inOutConfig.p2_x,
                p2_y=payload.inOutConfig.p2_y,
                in_side=payload.inOutConfig.in_side
            ))
                
        db.commit()
        return {"message": "Camera updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
