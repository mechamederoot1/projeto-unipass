from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum, func
from sqlalchemy.orm import relationship
from database.connection import Base
import enum
from datetime import datetime


class CouponType(enum.Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_MONTH = "free_month"


class ReservationStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class EquipmentType(enum.Enum):
    CARDIO = "cardio"
    STRENGTH = "strength"
    FUNCTIONAL = "functional"
    POOL = "pool"
    COURT = "court"
    CLASS_ROOM = "class_room"


class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    coupon_type = Column(Enum(CouponType), nullable=False)
    discount_value = Column(Float, nullable=False)  # Percentage or fixed amount
    min_purchase_amount = Column(Float, nullable=True)
    max_discount_amount = Column(Float, nullable=True)  # Cap for percentage discounts
    usage_limit = Column(Integer, nullable=True)  # Null = unlimited
    usage_count = Column(Integer, default=0)
    user_limit = Column(Integer, default=1)  # How many times per user
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=False)
    applicable_plans = Column(String(200))  # JSON array of plan IDs
    first_time_users_only = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User")
    usages = relationship("CouponUsage", back_populates="coupon")
    
    def __repr__(self):
        return f"<Coupon(id={self.id}, code='{self.code}', type={self.coupon_type})>"
    
    @property
    def is_valid(self):
        now = datetime.utcnow()
        return (self.is_active and 
                self.valid_from <= now <= self.valid_until and
                (self.usage_limit is None or self.usage_count < self.usage_limit))
    
    def can_use(self, user_id: int, purchase_amount: float = None):
        if not self.is_valid:
            return False
        
        if self.min_purchase_amount and purchase_amount and purchase_amount < self.min_purchase_amount:
            return False
        
        # Check user usage limit
        user_usage_count = len([u for u in self.usages if u.user_id == user_id])
        if user_usage_count >= self.user_limit:
            return False
        
        return True


class CouponUsage(Base):
    __tablename__ = "coupon_usages"
    
    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    discount_amount = Column(Float, nullable=False)
    original_amount = Column(Float, nullable=False)
    final_amount = Column(Float, nullable=False)
    used_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    coupon = relationship("Coupon", back_populates="usages")
    user = relationship("User")
    subscription = relationship("Subscription")
    payment = relationship("Payment")
    
    def __repr__(self):
        return f"<CouponUsage(id={self.id}, coupon_id={self.coupon_id}, discount={self.discount_amount})>"


class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    equipment_type = Column(Enum(EquipmentType), nullable=False)
    description = Column(Text)
    capacity = Column(Integer, default=1)  # How many people can use simultaneously
    is_reservable = Column(Boolean, default=False)
    reservation_duration_minutes = Column(Integer, default=60)
    advance_booking_hours = Column(Integer, default=24)  # How far in advance can book
    is_active = Column(Boolean, default=True)
    maintenance_notes = Column(Text)
    last_maintenance = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    gym = relationship("Gym")
    reservations = relationship("Reservation", back_populates="equipment")
    
    def __repr__(self):
        return f"<Equipment(id={self.id}, name='{self.name}', gym_id={self.gym_id})>"


class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.PENDING)
    notes = Column(Text)
    confirmation_code = Column(String(10), unique=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    equipment = relationship("Equipment", back_populates="reservations")
    
    def __repr__(self):
        return f"<Reservation(id={self.id}, user_id={self.user_id}, equipment_id={self.equipment_id})>"
    
    @property
    def is_active(self):
        now = datetime.utcnow()
        return (self.status in [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] and
                self.end_time > now)
    
    @property
    def can_cancel(self):
        now = datetime.utcnow()
        # Can cancel up to 2 hours before start time
        return self.start_time > now and (self.start_time - now).total_seconds() > 7200


class ClassSchedule(Base):
    __tablename__ = "class_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    instructor_name = Column(String(100))
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String(5), nullable=False)  # HH:MM format
    end_time = Column(String(5), nullable=False)
    max_participants = Column(Integer, default=20)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    requires_reservation = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    gym = relationship("Gym")
    equipment = relationship("Equipment")
    
    def __repr__(self):
        return f"<ClassSchedule(id={self.id}, name='{self.name}', gym_id={self.gym_id})>"
