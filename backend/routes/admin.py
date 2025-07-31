from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from database.connection import get_db
from models.user import User
from models.gym import Gym
from models.checkin import CheckIn
from models.admin import AdminUser, UserRole
from models.subscription import Subscription, Plan, Payment
from models.audit import AuditLog
from models.support import SupportTicket
from utils.auth import get_current_user

router = APIRouter()


async def get_super_admin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verify user is a super admin"""
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id,
        AdminUser.role == UserRole.SUPER_ADMIN,
        AdminUser.is_active == True
    ).first()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Super admin privileges required."
        )
    
    return admin_user


@router.get("/dashboard")
async def get_admin_dashboard(
    admin_user: AdminUser = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard overview"""
    
    # Overall stats
    total_users = db.query(User).filter(User.is_active == True).count()
    total_gyms = db.query(Gym).filter(Gym.is_active == True).count()
    active_subscriptions = db.query(Subscription).filter(
        Subscription.status == "active"
    ).count()
    
    # Today's activity
    today = datetime.utcnow().date()
    today_checkins = db.query(CheckIn).filter(
        func.date(CheckIn.checkin_time) == today
    ).count()
    
    # New users this week
    week_start = datetime.utcnow() - timedelta(days=7)
    new_users_week = db.query(User).filter(
        User.created_at >= week_start
    ).count()
    
    # Revenue this month (mock calculation)
    month_start = datetime.utcnow().replace(day=1)
    month_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == "completed",
        Payment.payment_date >= month_start
    ).scalar() or 0
    
    # Top gyms by check-ins (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    top_gyms = db.query(
        Gym.name,
        func.count(CheckIn.id).label('checkin_count')
    ).join(CheckIn).filter(
        CheckIn.checkin_time >= thirty_days_ago
    ).group_by(Gym.id, Gym.name).order_by(
        func.count(CheckIn.id).desc()
    ).limit(5).all()
    
    # Recent activity
    recent_checkins = db.query(CheckIn).order_by(
        CheckIn.checkin_time.desc()
    ).limit(10).all()
    
    recent_activity = []
    for checkin in recent_checkins:
        user = db.query(User).filter(User.id == checkin.user_id).first()
        gym = db.query(Gym).filter(Gym.id == checkin.gym_id).first()
        recent_activity.append({
            "type": "checkin",
            "user_name": user.name if user else "Unknown",
            "gym_name": gym.name if gym else "Unknown",
            "timestamp": checkin.checkin_time
        })
    
    # Open support tickets
    open_tickets = db.query(SupportTicket).filter(
        SupportTicket.status.in_(["open", "in_progress"])
    ).count()
    
    return {
        "stats": {
            "total_users": total_users,
            "total_gyms": total_gyms,
            "active_subscriptions": active_subscriptions,
            "today_checkins": today_checkins,
            "new_users_week": new_users_week,
            "month_revenue": float(month_revenue),
            "open_tickets": open_tickets
        },
        "top_gyms": [
            {"name": name, "checkins": count} 
            for name, count in top_gyms
        ],
        "recent_activity": recent_activity
    }


@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    admin_user: AdminUser = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    """Get paginated list of users"""
    
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    
    total = query.count()
    offset = (page - 1) * limit
    users = query.offset(offset).limit(limit).all()
    
    users_data = []
    for user in users:
        # Get user's current subscription
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.status == "active"
        ).first()
        
        # Get total check-ins
        total_checkins = db.query(CheckIn).filter(
            CheckIn.user_id == user.id
        ).count()
        
        users_data.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "subscription": {
                "plan_name": subscription.plan.name if subscription else None,
                "status": subscription.status if subscription else None,
                "end_date": subscription.end_date if subscription else None
            },
            "total_checkins": total_checkins
        })
    
    return {
        "users": users_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/gyms")
async def get_gyms_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    admin_user: AdminUser = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    """Get paginated list of gyms for admin"""
    
    query = db.query(Gym)
    
    if search:
        query = query.filter(
            or_(
                Gym.name.ilike(f"%{search}%"),
                Gym.address.ilike(f"%{search}%")
            )
        )
    
    total = query.count()
    offset = (page - 1) * limit
    gyms = query.offset(offset).limit(limit).all()
    
    gyms_data = []
    for gym in gyms:
        # Get stats for each gym
        total_checkins = db.query(CheckIn).filter(
            CheckIn.gym_id == gym.id
        ).count()
        
        # This month's checkins
        month_start = datetime.utcnow().replace(day=1)
        month_checkins = db.query(CheckIn).filter(
            CheckIn.gym_id == gym.id,
            CheckIn.checkin_time >= month_start
        ).count()
        
        gyms_data.append({
            "id": gym.id,
            "name": gym.name,
            "address": gym.address,
            "phone": gym.phone,
            "current_occupancy": gym.current_occupancy,
            "max_capacity": gym.max_capacity,
            "occupancy_percentage": gym.occupancy_percentage,
            "rating": gym.rating,
            "total_reviews": gym.total_reviews,
            "is_active": gym.is_active,
            "created_at": gym.created_at,
            "total_checkins": total_checkins,
            "month_checkins": month_checkins
        })
    
    return {
        "gyms": gyms_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.patch("/users/{user_id}/status")
async def toggle_user_status(
    user_id: int,
    admin_user: AdminUser = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_status = user.is_active
    user.is_active = not user.is_active
    
    # Log the action
    AuditLog.log_action(
        db,
        user_id=admin_user.user_id,
        action="TOGGLE_USER_STATUS",
        entity_type="USER",
        entity_id=user.id,
        description=f"Changed user status from {old_status} to {user.is_active}"
    )
    
    db.commit()
    
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "user_id": user_id,
        "new_status": user.is_active
    }


@router.patch("/gyms/{gym_id}/status")
async def toggle_gym_status(
    gym_id: int,
    admin_user: AdminUser = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a gym"""
    
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gym not found"
        )
    
    old_status = gym.is_active
    gym.is_active = not gym.is_active
    
    # Log the action
    AuditLog.log_action(
        db,
        user_id=admin_user.user_id,
        action="TOGGLE_GYM_STATUS",
        entity_type="GYM",
        entity_id=gym.id,
        description=f"Changed gym status from {old_status} to {gym.is_active}"
    )
    
    db.commit()
    
    return {
        "message": f"Gym {'activated' if gym.is_active else 'deactivated'} successfully",
        "gym_id": gym_id,
        "new_status": gym.is_active
    }


@router.get("/analytics/overview")
async def get_analytics_overview(
    days: int = Query(30, ge=1, le=365),
    admin_user: AdminUser = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    """Get analytics overview for specified period"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily check-ins for the period
    daily_checkins = db.query(
        func.date(CheckIn.checkin_time).label('date'),
        func.count(CheckIn.id).label('count')
    ).filter(
        CheckIn.checkin_time >= start_date
    ).group_by(func.date(CheckIn.checkin_time)).all()
    
    # New users by day
    daily_signups = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= start_date
    ).group_by(func.date(User.created_at)).all()
    
    # Revenue by day (mock calculation)
    daily_revenue = db.query(
        func.date(Payment.payment_date).label('date'),
        func.sum(Payment.amount).label('revenue')
    ).filter(
        Payment.status == "completed",
        Payment.payment_date >= start_date
    ).group_by(func.date(Payment.payment_date)).all()
    
    return {
        "period_days": days,
        "daily_checkins": [
            {"date": str(date), "count": count} 
            for date, count in daily_checkins
        ],
        "daily_signups": [
            {"date": str(date), "count": count} 
            for date, count in daily_signups
        ],
        "daily_revenue": [
            {"date": str(date), "revenue": float(revenue)} 
            for date, revenue in daily_revenue
        ]
    }


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    admin_user: AdminUser = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    """Get audit logs with filtering"""
    
    query = db.query(AuditLog)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    query = query.order_by(AuditLog.timestamp.desc())
    
    total = query.count()
    offset = (page - 1) * limit
    logs = query.offset(offset).limit(limit).all()
    
    logs_data = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        logs_data.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "description": log.description,
            "user_name": user.name if user else "System",
            "ip_address": log.ip_address,
            "timestamp": log.timestamp
        })
    
    return {
        "logs": logs_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }
