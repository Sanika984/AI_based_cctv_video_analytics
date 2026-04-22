# backend/app/models/heatmap_point.py

from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.db.base import Base

class HeatmapPoint(Base):
    __tablename__ = "heatmap_points"

    id = Column(String, primary_key=True)
    camera_id = Column(String, ForeignKey("cameras.camera_id"), nullable=False)
    x_normalized = Column(Float, nullable=False)
    y_normalized = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)