from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, func
from database.connection import Base


class Gym(Base):
    __tablename__ = "gyms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    open_hours_weekdays = Column(String(50), nullable=False)
    open_hours_weekends = Column(String(50), nullable=False)
    amenities = Column(Text)  # Comma-separated string
    description = Column(Text)
    max_capacity = Column(Integer, default=100)
    current_occupancy = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Gym(id={self.id}, name='{self.name}', address='{self.address}')>"
    
    @property
    def amenities_list(self):
        return self.amenities.split(',') if self.amenities else []
    
    @property
    def occupancy_percentage(self):
        if self.max_capacity == 0:
            return 0
        return (self.current_occupancy / self.max_capacity) * 100
    
    @property
    def is_open_now(self):
        # Simple implementation - in real app would check current time
        return self.is_active
