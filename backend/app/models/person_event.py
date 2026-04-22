# backend/app/models/person_event.py

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from app.db.base import Base

class PersonEvent(Base):
    __tablename__ = "person_events"

    event_id = Column(String, primary_key=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id"), nullable=False)
    person_id = Column(Integer, nullable=False)
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime)