from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.db.base import Base
from sqlalchemy.orm import relationship

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(String, primary_key=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id"), nullable=False)

    alert_type = Column(Text, nullable=False)
    severity = Column(Text, nullable=False)
    status = Column(Text, nullable=False)

    reference_id = Column(Text)
    timestamp = Column(DateTime, nullable=False)

    acknowledged_by = Column(Text)
    acknowledged_at = Column(DateTime)
    camera = relationship("Camera", back_populates="alerts")
