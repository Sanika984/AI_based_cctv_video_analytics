from sqlalchemy import Column, String, ForeignKey, Integer
from app.db.base import Base
from sqlalchemy.orm import relationship

class CameraModule(Base):
    __tablename__ = "camera_modules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id", ondelete="CASCADE"), nullable=False)
    module_name = Column(String, nullable=False)

    camera = relationship("Camera", back_populates="modules")
