from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from database.connection import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, CHECKIN, CHECKOUT, CREATE_USER, etc
    entity_type = Column(String(50), nullable=True)  # USER, GYM, CHECKIN, etc
    entity_id = Column(Integer, nullable=True)
    description = Column(String(500))
    details = Column(Text)  # JSON string with additional details
    ip_address = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(String(500))
    session_id = Column(String(100))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', user_id={self.user_id})>"
    
    @classmethod
    def log_action(cls, db_session, user_id, action, entity_type=None, entity_id=None, 
                   description=None, details=None, ip_address=None, user_agent=None, session_id=None):
        """Helper method to create audit log entries"""
        log_entry = cls(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id
        )
        db_session.add(log_entry)
        return log_entry
