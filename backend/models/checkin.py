from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from database.connection import Base


class CheckIn(Base):
    __tablename__ = "checkins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)
    checkin_time = Column(DateTime(timezone=True), server_default=func.now())
    checkout_time = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)  # True if still checked in
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    gym = relationship("Gym")
    
    def __repr__(self):
        return f"<CheckIn(id={self.id}, user_id={self.user_id}, gym_id={self.gym_id}, active={self.is_active})>"
    
    @property
    def duration_minutes(self):
        if not self.checkout_time:
            return None
        delta = self.checkout_time - self.checkin_time
        return int(delta.total_seconds() / 60)
