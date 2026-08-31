# backend/app/models/vehicle_log.py

from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class VehicleLog(Base):
    __tablename__ = "vehicle_logs"

    log_id = Column(String, primary_key=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id"), nullable=False)

    plate_number = Column(Text, nullable=False)
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime)

    confidence_score = Column(Float)
    is_blacklisted = Column(Boolean, nullable=False, default=False)
    snapshot_url = Column(Text, nullable=True)

    camera = relationship("Camera", back_populates="vehicle_logs")