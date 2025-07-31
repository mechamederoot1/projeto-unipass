from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import datetime, timedelta

from database.connection import get_db
from models.user import User
from models.gym import Gym
from models.checkin import CheckIn
from models.admin import AdminUser, UserRole
from models.audit import AuditLog
from utils.auth import get_current_user

router = APIRouter()


async def get_gym_admin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verify user is a gym admin"""
    admin_user = db.query(AdminUser).filter(
        AdminUser.user_id == current_user.id,
        AdminUser.role.in_([UserRole.GYM_ADMIN, UserRole.SUPER_ADMIN]),
        AdminUser.is_active == True
    ).first()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Gym admin privileges required."
        )
    
    return admin_user


@router.get("/dashboard")
async def get_gym_dashboard(
    gym_id: int = None,
    admin_user: AdminUser = Depends(get_gym_admin),
    db: Session = Depends(get_db)
):
    """Get gym dashboard data"""
    
    # Determine which gym to show
    if admin_user.role == UserRole.SUPER_ADMIN:
        if not gym_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="gym_id parameter required for super admin"
            )
        target_gym_id = gym_id
    else:
        target_gym_id = admin_user.gym_id
    
    # Get gym details
    gym = db.query(Gym).filter(Gym.id == target_gym_id, Gym.is_active == True).first()
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gym not found"
        )
    
    # Current stats
    active_checkins = db.query(CheckIn).filter(
        CheckIn.gym_id == target_gym_id,
        CheckIn.is_active == True
    ).count()
    
    # Today's stats
    today = datetime.utcnow().date()
    today_checkins = db.query(CheckIn).filter(
        CheckIn.gym_id == target_gym_id,
        func.date(CheckIn.checkin_time) == today
    ).count()
    
    # This week's stats
    week_start = datetime.utcnow() - timedelta(days=7)
    week_checkins = db.query(CheckIn).filter(
        CheckIn.gym_id == target_gym_id,
        CheckIn.checkin_time >= week_start
    ).count()
    
    # This month's stats
    month_start = datetime.utcnow().replace(day=1)
    month_checkins = db.query(CheckIn).filter(
        CheckIn.gym_id == target_gym_id,
        CheckIn.checkin_time >= month_start
    ).count()
    
    # Peak hours analysis (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    hourly_checkins = db.query(
        func.extract('hour', CheckIn.checkin_time).label('hour'),
        func.count(CheckIn.id).label('count')
    ).filter(
        CheckIn.gym_id == target_gym_id,
        CheckIn.checkin_time >= thirty_days_ago
    ).group_by(func.extract('hour', CheckIn.checkin_time)).all()
    
    # Daily trend (last 7 days)
    daily_checkins = []
    for i in range(7):
        date = datetime.utcnow().date() - timedelta(days=i)
        count = db.query(CheckIn).filter(
            CheckIn.gym_id == target_gym_id,
            func.date(CheckIn.checkin_time) == date
        ).count()
        daily_checkins.append({
            "date": date.isoformat(),
            "checkins": count
        })
    
    return {
        "gym": {
            "id": gym.id,
            "name": gym.name,
            "address": gym.address,
            "current_occupancy": gym.current_occupancy,
            "max_capacity": gym.max_capacity,
            "occupancy_percentage": gym.occupancy_percentage
        },
        "stats": {
            "active_checkins": active_checkins,
            "today_checkins": today_checkins,
            "week_checkins": week_checkins,
            "month_checkins": month_checkins
        },
        "hourly_distribution": [
            {"hour": int(hour), "count": count} 
            for hour, count in hourly_checkins
        ],
        "daily_trend": daily_checkins
    }


@router.get("/active-checkins")
async def get_active_checkins(
    gym_id: int = None,
    admin_user: AdminUser = Depends(get_gym_admin),
    db: Session = Depends(get_db)
):
    """Get list of currently active check-ins"""
    
    target_gym_id = gym_id if admin_user.role == UserRole.SUPER_ADMIN else admin_user.gym_id
    
    active_checkins = db.query(CheckIn).filter(
        CheckIn.gym_id == target_gym_id,
        CheckIn.is_active == True
    ).all()
    
    result = []
    for checkin in active_checkins:
        user = db.query(User).filter(User.id == checkin.user_id).first()
        result.append({
            "id": checkin.id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "checkin_time": checkin.checkin_time,
            "duration_minutes": int((datetime.utcnow() - checkin.checkin_time).total_seconds() / 60)
        })
    
    return result


@router.post("/force-checkout/{checkin_id}")
async def force_checkout(
    checkin_id: int,
    reason: str = "Forced by gym admin",
    admin_user: AdminUser = Depends(get_gym_admin),
    db: Session = Depends(get_db)
):
    """Force checkout a user (emergency/closing time)"""
    
    checkin = db.query(CheckIn).filter(
        CheckIn.id == checkin_id,
        CheckIn.is_active == True
    ).first()
    
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active check-in not found"
        )
    
    # Verify admin can manage this gym
    if admin_user.role == UserRole.GYM_ADMIN and checkin.gym_id != admin_user.gym_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot manage check-ins for other gyms"
        )
    
    # Force checkout
    checkin.checkout_time = datetime.utcnow()
    checkin.is_active = False
    
    # Update gym occupancy
    gym = db.query(Gym).filter(Gym.id == checkin.gym_id).first()
    if gym and gym.current_occupancy > 0:
        gym.current_occupancy -= 1
    
    # Log the action
    AuditLog.log_action(
        db, 
        user_id=admin_user.user_id,
        action="FORCE_CHECKOUT",
        entity_type="CHECKIN",
        entity_id=checkin.id,
        description=f"Forced checkout by gym admin. Reason: {reason}"
    )
    
    db.commit()
    
    return {"message": "User checked out successfully", "checkin_id": checkin_id}


@router.patch("/update-capacity")
async def update_gym_capacity(
    new_capacity: int,
    gym_id: int = None,
    admin_user: AdminUser = Depends(get_gym_admin),
    db: Session = Depends(get_db)
):
    """Update gym capacity"""
    
    target_gym_id = gym_id if admin_user.role == UserRole.SUPER_ADMIN else admin_user.gym_id
    
    gym = db.query(Gym).filter(Gym.id == target_gym_id).first()
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gym not found"
        )
    
    old_capacity = gym.max_capacity
    gym.max_capacity = new_capacity
    
    # Log the action
    AuditLog.log_action(
        db,
        user_id=admin_user.user_id,
        action="UPDATE_GYM_CAPACITY",
        entity_type="GYM",
        entity_id=gym.id,
        description=f"Updated gym capacity from {old_capacity} to {new_capacity}"
    )
    
    db.commit()
    
    return {"message": "Gym capacity updated successfully", "new_capacity": new_capacity}


@router.get("/reports/checkins")
async def get_checkins_report(
    start_date: str,
    end_date: str,
    gym_id: int = None,
    admin_user: AdminUser = Depends(get_gym_admin),
    db: Session = Depends(get_db)
):
    """Get detailed check-ins report for date range"""
    
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
        )
    
    target_gym_id = gym_id if admin_user.role == UserRole.SUPER_ADMIN else admin_user.gym_id
    
    checkins = db.query(CheckIn).filter(
        CheckIn.gym_id == target_gym_id,
        CheckIn.checkin_time >= start,
        CheckIn.checkin_time <= end
    ).all()
    
    report_data = []
    for checkin in checkins:
        user = db.query(User).filter(User.id == checkin.user_id).first()
        report_data.append({
            "checkin_id": checkin.id,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "checkin_time": checkin.checkin_time,
            "checkout_time": checkin.checkout_time,
            "duration_minutes": checkin.duration_minutes,
            "is_active": checkin.is_active
        })
    
    # Summary stats
    total_checkins = len(checkins)
    total_duration = sum(c.duration_minutes or 0 for c in checkins)
    avg_duration = total_duration / total_checkins if total_checkins > 0 else 0
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "summary": {
            "total_checkins": total_checkins,
            "total_duration_minutes": total_duration,
            "average_duration_minutes": round(avg_duration, 2)
        },
        "checkins": report_data
    }
