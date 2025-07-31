from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from models.user import User
from models.checkin import CheckIn
from schemas.user import UserResponse, UserUpdate
from schemas.checkin import CheckInWithDetails
from utils.auth import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update only provided fields
    update_data = user_update.dict(exclude_unset=True)
    
    # Check if email is being updated and if it's already taken
    if "email" in update_data:
        existing_user = db.query(User).filter(
            User.email == update_data["email"],
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Apply updates
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/me/checkins", response_model=List[CheckInWithDetails])
async def get_user_checkins(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    checkins = db.query(CheckIn).filter(
        CheckIn.user_id == current_user.id
    ).order_by(CheckIn.checkin_time.desc()).limit(limit).all()
    
    # Add gym details to each checkin
    result = []
    for checkin in checkins:
        checkin_dict = {
            "id": checkin.id,
            "user_id": checkin.user_id,
            "gym_id": checkin.gym_id,
            "checkin_time": checkin.checkin_time,
            "checkout_time": checkin.checkout_time,
            "is_active": checkin.is_active,
            "duration_minutes": checkin.duration_minutes,
            "gym_name": checkin.gym.name,
            "gym_address": checkin.gym.address
        }
        result.append(checkin_dict)
    
    return result


@router.get("/me/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user statistics
    total_checkins = db.query(CheckIn).filter(CheckIn.user_id == current_user.id).count()
    
    # Count unique gyms visited
    unique_gyms = db.query(CheckIn.gym_id).filter(
        CheckIn.user_id == current_user.id
    ).distinct().count()
    
    # Calculate total hours (approximate)
    completed_checkins = db.query(CheckIn).filter(
        CheckIn.user_id == current_user.id,
        CheckIn.checkout_time.isnot(None)
    ).all()
    
    total_minutes = sum(checkin.duration_minutes or 0 for checkin in completed_checkins)
    total_hours = total_minutes // 60
    
    return {
        "total_checkins": total_checkins,
        "unique_gyms_visited": unique_gyms,
        "total_hours_trained": total_hours,
        "member_since": current_user.created_at
    }
