from sqlalchemy import Column, String, Text, DateTime
from app.db.base import Base
from sqlalchemy.orm import relationship

class Camera(Base):
    __tablename__ = "cameras"

    camera_id = Column(String, primary_key=True)
    name = Column(Text, nullable=False)
    location = Column(Text, nullable=False)
    source = Column(Text, nullable=False)
    status = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False)

    alerts = relationship("Alert", back_populates="camera")
    vehicle_logs = relationship("VehicleLog", back_populates="camera")

    metadata_info = relationship("CameraMetadata", back_populates="camera", uselist=False, cascade="all, delete-orphan")
    modules = relationship("CameraModule", back_populates="camera", cascade="all, delete-orphan")
    features = relationship("CameraFeature", back_populates="camera", cascade="all, delete-orphan")
    in_out_config = relationship("CameraInOutConfig", back_populates="camera", uselist=False, cascade="all, delete-orphan")