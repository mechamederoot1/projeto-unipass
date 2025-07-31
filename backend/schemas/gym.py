from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class GymBase(BaseModel):
    name: str
    address: str
    phone: str
    latitude: float
    longitude: float
    open_hours_weekdays: str
    open_hours_weekends: str
    amenities: Optional[str] = None
    description: Optional[str] = None
    max_capacity: int = 100


class GymCreate(GymBase):
    pass


class GymUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    open_hours_weekdays: Optional[str] = None
    open_hours_weekends: Optional[str] = None
    amenities: Optional[str] = None
    description: Optional[str] = None
    max_capacity: Optional[int] = None
    current_occupancy: Optional[int] = None


class GymResponse(GymBase):
    id: int
    current_occupancy: int
    rating: float
    total_reviews: int
    is_active: bool
    created_at: datetime
    amenities_list: List[str]
    occupancy_percentage: float
    is_open_now: bool
    
    class Config:
        from_attributes = True


class GymSearchResponse(BaseModel):
    id: int
    name: str
    address: str
    distance: Optional[float] = None
    rating: float
    is_open_now: bool
    current_occupancy: int
    max_capacity: int
    occupancy_percentage: float
    
    class Config:
        from_attributes = True
