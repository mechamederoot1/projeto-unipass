from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CheckInBase(BaseModel):
    gym_id: int


class CheckInCreate(CheckInBase):
    pass


class CheckInResponse(CheckInBase):
    id: int
    user_id: int
    checkin_time: datetime
    checkout_time: Optional[datetime] = None
    is_active: bool
    duration_minutes: Optional[int] = None
    
    class Config:
        from_attributes = True


class CheckInWithDetails(CheckInResponse):
    gym_name: str
    gym_address: str
    
    class Config:
        from_attributes = True


class CheckOutRequest(BaseModel):
    checkin_id: int
