from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class PlanResponse(BaseModel):
    id: int
    name: str
    description: str
    plan_type: str
    price_monthly: float
    price_yearly: float
    features: List[str]
    max_checkins_per_month: Optional[int] = None
    is_active: bool
    
    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    plan_id: int
    status: str
    billing_cycle: str
    price_paid: float
    start_date: datetime
    end_date: datetime
    auto_renew: bool
    
    # Related data
    plan_name: str
    plan_type: str
    
    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    subscription_id: int
    amount: float
    currency: str
    status: str
    payment_method: str
    gateway_transaction_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    plan_id: int
    billing_cycle: str  # monthly, yearly
    payment_method: str
    auto_renew: bool = True


class SubscriptionUpdate(BaseModel):
    auto_renew: Optional[bool] = None
    status: Optional[str] = None


class PaymentCreate(BaseModel):
    subscription_id: int
    amount: float
    payment_method: str
    gateway_transaction_id: str


class UserSubscriptionSummary(BaseModel):
    current_subscription: Optional[SubscriptionResponse] = None
    available_plans: List[PlanResponse]
    usage_stats: dict
    can_checkin: bool
    checkins_remaining: Optional[int] = None


class SubscriptionStats(BaseModel):
    total_revenue: float
    active_subscriptions: int
    churn_rate: float
    mrr: float  # Monthly Recurring Revenue
    popular_plan: str
    conversion_rate: float
