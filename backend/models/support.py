from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum, func
from sqlalchemy.orm import relationship
from database.connection import Base
import enum


class TicketStatus(enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_USER = "waiting_user"
    CLOSED = "closed"


class TicketPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketCategory(enum.Enum):
    TECHNICAL = "technical"
    BILLING = "billing"
    GYM_ISSUE = "gym_issue"
    FEATURE_REQUEST = "feature_request"
    OTHER = "other"


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)  # Support agent
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(TicketCategory), nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    related_gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=True)
    related_checkin_id = Column(Integer, ForeignKey("checkins.id"), nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    assigned_agent = relationship("User", foreign_keys=[assigned_to])
    related_gym = relationship("Gym")
    related_checkin = relationship("CheckIn")
    messages = relationship("TicketMessage", back_populates="ticket")
    
    def __repr__(self):
        return f"<SupportTicket(id={self.id}, title='{self.title}', status={self.status})>"


class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal note for support agents
    attachments = Column(Text)  # JSON array of file paths
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    ticket = relationship("SupportTicket", back_populates="messages")
    user = relationship("User")
    
    def __repr__(self):
        return f"<TicketMessage(id={self.id}, ticket_id={self.ticket_id}, user_id={self.user_id})>"


class GymReview(Base):
    __tablename__ = "gym_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    gym_id = Column(Integer, ForeignKey("gyms.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(100), nullable=True)
    comment = Column(Text, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    helpful_votes = Column(Integer, default=0)
    reported_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    gym = relationship("Gym")
    
    def __repr__(self):
        return f"<GymReview(id={self.id}, gym_id={self.gym_id}, rating={self.rating})>"


class ReviewHelpful(Base):
    __tablename__ = "review_helpful"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_id = Column(Integer, ForeignKey("gym_reviews.id"), nullable=False)
    is_helpful = Column(Boolean, nullable=False)  # True = helpful, False = not helpful
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    review = relationship("GymReview")
    
    def __repr__(self):
        return f"<ReviewHelpful(user_id={self.user_id}, review_id={self.review_id}, helpful={self.is_helpful})>"
