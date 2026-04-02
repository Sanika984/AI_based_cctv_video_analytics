# backend/app/services/vehicle_service.py

from app.models.vehicle_log import VehicleLog
from app.models.blacklisted_vehicle import BlacklistedVehicle
from app.models.alert import Alert
from datetime import datetime
import uuid

def process_vehicle_entry(db, camera_id, plate_number, confidence):

    # Check blacklist
    blacklisted = db.query(BlacklistedVehicle).filter(
        BlacklistedVehicle.plate_number == plate_number,
        BlacklistedVehicle.is_active == True
    ).first()

    is_blacklisted = blacklisted is not None

    # Create vehicle log
    log = VehicleLog(
        log_id=str(uuid.uuid4()),
        camera_id=camera_id,
        plate_number=plate_number,
        entry_time=datetime.now(),
        confidence_score=confidence,
        is_blacklisted=is_blacklisted
    )

    db.add(log)

    # If blacklisted → create alert
    if is_blacklisted:
        alert = Alert(
            alert_id=str(uuid.uuid4()),
            camera_id=camera_id,
            alert_type="blacklist",
            severity="high",
            status="open",
            reference_id=log.log_id,
            timestamp=datetime.now()
        )
        db.add(alert)

    db.commit()

    return log