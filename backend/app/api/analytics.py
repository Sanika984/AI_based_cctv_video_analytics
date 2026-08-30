from fastapi import APIRouter, Depends
from app.db.connection import SessionLocal
from app.models.footfall_log import FootfallLog
from app.models.heatmap_point import HeatmapPoint
from app.models.in_out_log import InOutLog
from app.models.camera_metadata import CameraMetadata
from sqlalchemy import func
from datetime import datetime, timedelta

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

@router.get("/in-out/summary")
def get_in_out_summary(db=Depends(get_db)):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)

    # Today's stats
    today_stats = db.query(
        func.sum(InOutLog.in_count).label("total_in"),
        func.sum(InOutLog.out_count).label("total_out")
    ).filter(InOutLog.timestamp >= today).first()

    # Yesterday's stats (for flow comparison)
    yesterday_stats = db.query(
        func.sum(InOutLog.in_count).label("total_in"),
        func.sum(InOutLog.out_count).label("total_out")
    ).filter(InOutLog.timestamp >= yesterday, InOutLog.timestamp < today).first()

    today_in = today_stats.total_in or 0
    today_out = today_stats.total_out or 0
    today_net = today_in - today_out

    yesterday_in = yesterday_stats.total_in or 1 # avoid div by zero
    yesterday_out = yesterday_stats.total_out or 0
    yesterday_net = yesterday_in - yesterday_out

    # Net Flow % = (Today Net - Yesterday Net) / Yesterday Net * 100
    # Actually, user might just mean current net flow % change in entries
    net_flow_pct = ((today_in - yesterday_in) / yesterday_in) * 100

    return {
        "live_occupancy": today_net,
        "total_in": today_in,
        "total_out": today_out,
        "net_flow_pct": round(net_flow_pct, 1)
    }

@router.get("/in-out/floor-wise")
def get_floor_wise_stats(db=Depends(get_db)):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Joining InOutLog with CameraMetadata to get Floor info
    results = db.query(
        CameraMetadata.floor,
        func.sum(InOutLog.in_count).label("total_in"),
        func.sum(InOutLog.out_count).label("total_out")
    ).join(CameraMetadata, InOutLog.camera_id == CameraMetadata.camera_id)\
     .filter(InOutLog.timestamp >= today)\
     .group_by(CameraMetadata.floor).all()

    return [
        {
            "floor": r.floor,
            "in_count": r.total_in,
            "out_count": r.total_out,
            "occupancy": r.total_in - r.total_out,
            # Traffic status mock based on volume
            "status": "High Traffic" if r.total_in > 100 else "Normal" if r.total_in > 50 else "Low",
            "percentage": min(100, int((r.total_in / 200) * 100)) # Normalized for UI progress bar
        }
        for r in results
    ]

@router.get("/in-out/hourly-stats")
def get_hourly_stats(db=Depends(get_db)):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    results = db.query(
        func.strftime('%H:00', InOutLog.timestamp).label("hour"),
        func.sum(InOutLog.in_count).label("total_in"),
        func.sum(InOutLog.out_count).label("total_out")
    ).filter(InOutLog.timestamp >= today)\
     .group_by("hour")\
     .order_by("hour").all()

    return [
        {
            "hour": r.hour,
            "in_count": r.total_in,
            "out_count": r.total_out
        }
        for r in results
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


@router.get("/alerts")
def get_security_alerts(
    alert_type: str = None,
    limit: int = 50,
    db=Depends(get_db)
):
    from app.models.alert import Alert
    from app.models.camera import Camera

    query = db.query(Alert, Camera).outerjoin(Camera, Alert.camera_id == Camera.camera_id)
    if alert_type and alert_type != "all":
        query = query.filter(Alert.alert_type.ilike(f"%{alert_type}%"))

    results = query.order_by(Alert.timestamp.desc()).limit(limit).all()

    return [
        {
            "alert_id": alert.alert_id,
            "camera_id": alert.camera_id,
            "camera_name": camera.name if camera else alert.camera_id,
            "location": camera.location if camera else "General",
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "status": alert.status,
            "reference_id": alert.reference_id,
            "timestamp": alert.timestamp.isoformat() if alert.timestamp else None,
            "acknowledged_by": alert.acknowledged_by,
            "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
        }
        for alert, camera in results
    ]


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    payload: dict = None,
    db=Depends(get_db)
):
    from app.models.alert import Alert
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        return {"success": False, "message": "Alert not found"}

    username = (payload and payload.get("username")) or "Operator"
    alert.status = "Acknowledged"
    alert.acknowledged_by = username
    alert.acknowledged_at = datetime.now()
    db.commit()

    return {
        "success": True,
        "message": f"Alert {alert_id} acknowledged by {username}",
        "alert_id": alert_id,
        "status": "Acknowledged"
    }


@router.get("/security/status")
def get_security_status():
    from app.services.fire_detection import security_cache
    return security_cache.get_all_states()


