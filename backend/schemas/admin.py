from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class AdminStatsResponse(BaseModel):
    total_users: int
    total_gyms: int
    total_checkins: int
    active_subscriptions: int
    revenue_monthly: float
    new_users_this_month: int
    growth_percentage: float


class UserManagementResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    is_active: bool
    subscription_status: str
    total_checkins: int
    member_since: datetime
    last_activity: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class GymManagementResponse(BaseModel):
    id: int
    name: str
    address: str
    current_occupancy: int
    max_capacity: int
    is_active: bool
    owner_name: str
    owner_email: str
    total_members: int
    revenue_monthly: float
    
    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    user_id: int
    is_active: bool


class GymStatusUpdate(BaseModel):
    gym_id: int
    is_active: bool


class SystemAlert(BaseModel):
    id: int
    type: str
    message: str
    level: str  # info, warning, error, critical
    created_at: datetime
    is_resolved: bool
    
    class Config:
        from_attributes = True


class SystemSettings(BaseModel):
    maintenance_mode: bool
    max_checkin_duration: int  # in minutes
    default_gym_capacity: int
    enable_notifications: bool
    enable_gamification: bool
