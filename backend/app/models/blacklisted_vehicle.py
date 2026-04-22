# backend/app/models/blacklisted_vehicle.py

from sqlalchemy import Column, String, Text, DateTime, Boolean
from app.db.base import Base

class BlacklistedVehicle(Base):
    __tablename__ = "blacklisted_vehicles"

    id = Column(String, primary_key=True)
    plate_number = Column(Text, nullable=False, unique=True)
    reason = Column(Text)
    added_by = Column(Text)
    added_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)