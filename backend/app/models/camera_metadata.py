from sqlalchemy import Column, String, Text, ForeignKey
from app.db.base import Base
from sqlalchemy.orm import relationship

class CameraMetadata(Base):
    __tablename__ = "camera_metadata"

    camera_id = Column(String, ForeignKey("cameras.camera_id", ondelete="CASCADE"), primary_key=True)
    floor = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    camera = relationship("Camera", back_populates="metadata_info")
