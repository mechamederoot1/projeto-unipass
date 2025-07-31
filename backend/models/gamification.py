from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from database.connection import Base


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(100))  # Icon name or URL
    points_reward = Column(Integer, default=0)
    condition_type = Column(String(50))  # CHECKIN_COUNT, STREAK_DAYS, UNIQUE_GYMS, etc
    condition_value = Column(Integer)  # Target value for the condition
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user_achievements = relationship("UserAchievement", back_populates="achievement")
    
    def __repr__(self):
        return f"<Achievement(id={self.id}, name='{self.name}', points={self.points_reward})>"


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    notified = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User")
    achievement = relationship("Achievement", back_populates="user_achievements")
    
    def __repr__(self):
        return f"<UserAchievement(user_id={self.user_id}, achievement_id={self.achievement_id})>"


class UserPoints(Base):
    __tablename__ = "user_points"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    total_points = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)  # Current consecutive days
    longest_streak = Column(Integer, default=0)  # Best streak ever
    last_checkin_date = Column(DateTime(timezone=True), nullable=True)
    level = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    point_history = relationship("PointHistory", back_populates="user_points")
    
    def __repr__(self):
        return f"<UserPoints(user_id={self.user_id}, total={self.total_points}, level={self.level})>"
    
    @property
    def points_to_next_level(self):
        """Calculate points needed for next level"""
        next_level_requirement = self.level * 100  # 100 points per level
        return max(0, next_level_requirement - self.total_points)
    
    def add_points(self, points: int, reason: str = None):
        """Add points and check for level up"""
        self.total_points += points
        
        # Check for level up
        new_level = self.total_points // 100 + 1
        if new_level > self.level:
            self.level = new_level
            return True  # Level up occurred
        return False


class PointHistory(Base):
    __tablename__ = "point_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_points_id = Column(Integer, ForeignKey("user_points.id"), nullable=False)
    points_change = Column(Integer, nullable=False)  # Can be negative
    reason = Column(String(100))  # CHECKIN, ACHIEVEMENT, STREAK_BONUS, etc
    description = Column(String(200))
    related_entity_type = Column(String(50))  # CHECKIN, ACHIEVEMENT, etc
    related_entity_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user_points = relationship("UserPoints", back_populates="point_history")
    
    def __repr__(self):
        return f"<PointHistory(id={self.id}, points={self.points_change}, reason='{self.reason}')>"
