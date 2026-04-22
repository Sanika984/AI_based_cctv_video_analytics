# backend/app/models/footfall_log.py

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from app.db.base import Base

class FootfallLog(Base):
    __tablename__ = "footfall_logs"

    log_id = Column(String, primary_key=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id"), nullable=False)
    count = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)