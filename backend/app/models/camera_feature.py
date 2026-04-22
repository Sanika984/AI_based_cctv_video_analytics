from sqlalchemy import Column, String, Boolean, ForeignKey, Integer
from app.db.base import Base
from sqlalchemy.orm import relationship

class CameraFeature(Base):
    __tablename__ = "camera_features"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id", ondelete="CASCADE"), nullable=False)
    feature_name = Column(String, nullable=False)
    is_enabled = Column(Boolean, default=False, nullable=False)

    camera = relationship("Camera", back_populates="features")
