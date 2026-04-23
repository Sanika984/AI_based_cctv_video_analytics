from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from app.db.base import Base

class InOutLog(Base):
    __tablename__ = "in_out_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id", ondelete="CASCADE"), nullable=False)
    in_count = Column(Integer, default=0, nullable=False)
    out_count = Column(Integer, default=0, nullable=False)
    timestamp = Column(DateTime, nullable=False)
