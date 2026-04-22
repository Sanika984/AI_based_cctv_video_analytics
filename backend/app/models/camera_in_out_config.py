from sqlalchemy import Column, String, Integer, ForeignKey
from app.db.base import Base
from sqlalchemy.orm import relationship

class CameraInOutConfig(Base):
    __tablename__ = "camera_in_out_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id", ondelete="CASCADE"), nullable=False, unique=True)
    p1_x = Column(Integer, nullable=False)
    p1_y = Column(Integer, nullable=False)
    p2_x = Column(Integer, nullable=False)
    p2_y = Column(Integer, nullable=False)
    in_side = Column(Integer, default=1, nullable=False) # 1 or -1 to denote side

    camera = relationship("Camera", back_populates="in_out_config")
