# backend/test_vehicle.py

from app.db.connection import SessionLocal
from app.services.vehicle_service import process_vehicle_entry
from app.models.blacklisted_vehicle import BlacklistedVehicle
from datetime import datetime

db = SessionLocal()

# Add blacklist entry
b = BlacklistedVehicle(
    id="b1",
    plate_number="MH01AB1234",
    added_at=datetime.now(),
    is_active=True
)
db.add(b)
db.commit()

# Process vehicle
log = process_vehicle_entry(
    db,
    camera_id="cam_1",
    plate_number="MH01AB1234",
    confidence=0.95
)

print("Log:", log.log_id)

# Check alerts
from app.models.alert import Alert
alerts = db.query(Alert).all()
print(alerts)