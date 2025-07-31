from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text, func
from sqlalchemy.orm import relationship
from database.connection import Base
import enum
from datetime import datetime, timedelta


class PlanType(enum.Enum):
    BASIC = "basic"
    PREMIUM = "premium"
    UNLIMITED = "unlimited"


class PaymentStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class SubscriptionStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    plan_type = Column(Enum(PlanType), nullable=False)
    price_monthly = Column(Float, nullable=False)
    price_yearly = Column(Float, nullable=True)
    max_checkins_per_month = Column(Integer, nullable=True)  # Null = unlimited
    max_gyms_access = Column(Integer, nullable=True)  # Null = all gyms
    features = Column(Text)  # JSON string of features
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")
    
    def __repr__(self):
        return f"<Plan(id={self.id}, name='{self.name}', type={self.plan_type})>"
    
    @property
    def features_list(self):
        if not self.features:
            return []
        import json
        try:
            return json.loads(self.features)
        except:
            return []


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.ACTIVE)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_yearly = Column(Boolean, default=False)
    auto_renew = Column(Boolean, default=True)
    checkins_used_this_month = Column(Integer, default=0)
    last_billing_date = Column(DateTime(timezone=True), nullable=True)
    next_billing_date = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    plan = relationship("Plan", back_populates="subscriptions")
    payments = relationship("Payment", back_populates="subscription")
    
    def __repr__(self):
        return f"<Subscription(id={self.id}, user_id={self.user_id}, plan_id={self.plan_id}, status={self.status})>"
    
    @property
    def is_active(self):
        return (self.status == SubscriptionStatus.ACTIVE and 
                self.end_date > datetime.utcnow())
    
    @property
    def days_remaining(self):
        if self.end_date:
            delta = self.end_date - datetime.utcnow()
            return max(0, delta.days)
        return 0
    
    def can_checkin(self):
        if not self.is_active:
            return False
        if self.plan.max_checkins_per_month is None:
            return True
        return self.checkins_used_this_month < self.plan.max_checkins_per_month


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="BRL")
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    payment_method = Column(String(50))  # credit_card, pix, boleto, etc
    transaction_id = Column(String(100), unique=True, nullable=True)
    external_payment_id = Column(String(100), nullable=True)  # From payment gateway
    payment_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    description = Column(String(200))
    payment_metadata = Column(Text)  # JSON string for additional payment data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subscription = relationship("Subscription", back_populates="payments")
    
    def __repr__(self):
        return f"<Payment(id={self.id}, subscription_id={self.subscription_id}, amount={self.amount}, status={self.status})>"
    
    @property
    def is_paid(self):
        return self.status == PaymentStatus.COMPLETED
    
    @property
    def is_overdue(self):
        return (self.status == PaymentStatus.PENDING and 
                self.due_date and 
                self.due_date < datetime.utcnow())
