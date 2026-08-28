from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.db.connection import SessionLocal
from app.models.camera import Camera
from app.models.camera_module import CameraModule
from app.models.camera_feature import CameraFeature
from app.models.camera_in_out_config import CameraInOutConfig
from app.models.user import User
from app.core.security import get_current_user, require_role
from app.schemas.camera import CameraCreate, CameraUpdate

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_camera_id() -> str:
    return f"CAM-{uuid.uuid4().hex[:6].upper()}"


def format_camera_response(c: Camera) -> dict:
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

    from app.services.video_ingestion import ingestion_manager
    fps = ingestion_manager.get_camera_fps(c.camera_id)

    return {
        "camera_id": c.camera_id,
        "name": c.name,
        "zone": c.location,
        "status": c.status,
        "sourceUrl": c.source,
        "module": module_name,
        "features": features_dict,
        "processingFps": fps,
        "inOutConfig": in_out_data
    }


@router.get("/", status_code=status.HTTP_200_OK)
def get_cameras(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cams = db.query(Camera).all()
    return [format_camera_response(c) for c in cams]


@router.get("/{camera_id}", status_code=status.HTTP_200_OK)
def get_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
    return format_camera_response(camera)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_camera(
    payload: CameraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    try:
        camera_id = generate_camera_id()
        new_camera = Camera(
            camera_id=camera_id,
            name=payload.name,
            location=payload.zone,
            source=payload.sourceUrl,
            status=payload.status,
            created_at=datetime.utcnow()
        )
        db.add(new_camera)

        # Add Module
        if payload.module:
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

        if payload.status == "Online":
            from app.services.video_ingestion import ingestion_manager, CameraConfig
            clean_source = str(payload.sourceUrl).strip()
            source_type = "webcam" if clean_source.isdigit() else ("rtsp" if clean_source.startswith(("rtsp://", "http://", "https://")) else "file")
            cfg = CameraConfig(
                camera_id=camera_id,
                camera_name=payload.name,
                source_type=source_type,
                source_identifier=int(clean_source) if source_type == "webcam" else clean_source,
                processing_fps=float(payload.processingFps or 5.0),
                location=payload.zone,
                enabled_features=payload.features or {},
                loop_file=True
            )
            ingestion_manager.start_camera(cfg)

        return {"message": "Camera created successfully", "camera_id": camera_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{camera_id}", status_code=status.HTTP_200_OK)
def update_camera(
    camera_id: str,
    payload: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
    
    try:
        if camera.source != payload.sourceUrl:
            from app.api.stream import stream_manager
            stream_manager.stop_stream(f"cam_{camera_id}")

        camera.name = payload.name
        camera.location = payload.zone
        camera.source = payload.sourceUrl
        camera.status = payload.status

        db.query(CameraModule).filter(CameraModule.camera_id == camera_id).delete()
        if payload.module:
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

        from app.services.video_ingestion import ingestion_manager, CameraConfig
        if payload.status == "Online":
            clean_source = str(payload.sourceUrl).strip()
            source_type = "webcam" if clean_source.isdigit() else ("rtsp" if clean_source.startswith(("rtsp://", "http://", "https://")) else "file")
            cfg = CameraConfig(
                camera_id=camera_id,
                camera_name=payload.name,
                source_type=source_type,
                source_identifier=int(clean_source) if source_type == "webcam" else clean_source,
                processing_fps=float(payload.processingFps or 5.0),
                location=payload.zone,
                enabled_features=payload.features or {},
                loop_file=True
            )
            ingestion_manager.start_camera(cfg)
        else:
            ingestion_manager.stop_camera(camera_id)

        return {"message": "Camera updated successfully", "camera_id": camera_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
    try:
        from app.api.stream import stream_manager
        stream_manager.stop_stream(f"cam_{camera_id}")

        from app.services.video_ingestion import ingestion_manager
        ingestion_manager.stop_camera(camera_id)

        db.delete(camera)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
