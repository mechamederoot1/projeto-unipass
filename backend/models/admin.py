from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import relationship
from database.connection import Base
import enum


class UserRole(enum.Enum):
    USER = "user"
    GYM_ADMIN = "gym_admin"
    SUPER_ADMIN = "super_admin"


class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Reference to main users table
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    gym_id = Column(Integer, nullable=True)  # Null for super admins
    permissions = Column(String(500))  # JSON string of permissions
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<AdminUser(id={self.id}, user_id={self.user_id}, role={self.role})>"
    
    @property
    def permissions_list(self):
        if not self.permissions:
            return []
        import json
        try:
            return json.loads(self.permissions)
        except:
            return []
    
    def has_permission(self, permission: str) -> bool:
        if self.role == UserRole.SUPER_ADMIN:
            return True
        return permission in self.permissions_list
    
    def can_manage_gym(self, gym_id: int) -> bool:
        if self.role == UserRole.SUPER_ADMIN:
            return True
        if self.role == UserRole.GYM_ADMIN and self.gym_id == gym_id:
            return True
        return False
