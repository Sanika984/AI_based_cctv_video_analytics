from pydantic import BaseModel
from typing import Optional


class BlacklistedVehicleBase(BaseModel):
    plate_number: str
    reason: Optional[str] = None
    added_by: Optional[str] = None
    is_active: bool = True


class BlacklistedVehicleCreate(BlacklistedVehicleBase):
    pass


class BlacklistedVehicleUpdate(BlacklistedVehicleBase):
    pass


class BlacklistedVehicleResponse(BaseModel):
    id: str
    plate_number: str
    reason: Optional[str] = None
    added_by: Optional[str] = None
    added_at: str
    is_active: bool