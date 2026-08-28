from pydantic import BaseModel
from typing import Dict, Optional, Literal


class InOutConfigBase(BaseModel):
    p1_x: int
    p1_y: int
    p2_x: int
    p2_y: int
    in_side: int


class CameraBase(BaseModel):
    name: str
    zone: str
    sourceUrl: str
    module: Optional[str] = "Consumer Analytics"
    features: Optional[Dict[str, bool]] = None
    status: Literal["Online", "Offline"] = "Offline"
    processingFps: Optional[float] = 5.0
    inOutConfig: Optional[InOutConfigBase] = None


class CameraCreate(CameraBase):
    pass


class CameraUpdate(CameraBase):
    pass


class SnapshotRequest(BaseModel):
    sourceUrl: str


class CameraResponse(BaseModel):
    camera_id: str
    name: str
    zone: str
    status: Literal["Online", "Offline"]
    sourceUrl: str
    module: str
    features: Dict[str, bool]
    processingFps: Optional[float] = 5.0
    inOutConfig: Optional[InOutConfigBase] = None
