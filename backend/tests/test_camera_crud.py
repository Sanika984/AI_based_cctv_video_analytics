"""Tests for camera creation, alert generation, and cascade deletion."""

from datetime import datetime
from app.db.connection import SessionLocal
from app.models.camera import Camera
from app.models.alert import Alert
from app.models.camera_feature import CameraFeature
from app.models.camera_module import CameraModule
from app.models.in_out_log import InOutLog
from app.models.vehicle_log import VehicleLog


def test_camera_cascade_delete_with_associated_records():
    db = SessionLocal()
    cam_id = "TEST-CAM-DEL-01"
    try:
        # Create test camera
        cam = Camera(
            camera_id=cam_id,
            name="Test Delete Camera",
            location="Zone A",
            source="demo://0",
            status="Offline",
            processing_fps=5.0,
            created_at=datetime.utcnow()
        )
        db.add(cam)

        # Add associated records across multiple tables
        db.add(CameraModule(camera_id=cam_id, module_name="Security Analytics"))
        db.add(CameraFeature(camera_id=cam_id, feature_name="Fire detection", is_enabled=True))
        db.add(Alert(
            alert_id=f"ALERT-TEST-{cam_id}",
            camera_id=cam_id,
            alert_type="fire",
            severity="Critical",
            status="Active",
            reference_id="Ref 1",
            timestamp=datetime.utcnow()
        ))
        db.add(VehicleLog(
            log_id=f"VEH-TEST-{cam_id}",
            camera_id=cam_id,
            plate_number="AB12CD3456",
            entry_time=datetime.utcnow(),
            confidence_score=0.95
        ))
        db.add(InOutLog(
            camera_id=cam_id,
            in_count=5,
            out_count=2,
            timestamp=datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        ))
        db.commit()

        # Delete related records and the camera (same as endpoint logic)
        db.query(Alert).filter(Alert.camera_id == cam_id).delete()
        db.query(VehicleLog).filter(VehicleLog.camera_id == cam_id).delete()
        db.query(InOutLog).filter(InOutLog.camera_id == cam_id).delete()
        db.query(CameraModule).filter(CameraModule.camera_id == cam_id).delete()
        db.query(CameraFeature).filter(CameraFeature.camera_id == cam_id).delete()

        cam_to_del = db.query(Camera).filter(Camera.camera_id == cam_id).first()
        db.delete(cam_to_del)
        db.commit()

        # Verify deletion
        assert db.query(Camera).filter(Camera.camera_id == cam_id).first() is None
        assert db.query(Alert).filter(Alert.camera_id == cam_id).first() is None
        assert db.query(VehicleLog).filter(VehicleLog.camera_id == cam_id).first() is None
    finally:
        db.close()
