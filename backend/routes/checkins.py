from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database.connection import get_db
from models.user import User
from models.gym import Gym
from models.checkin import CheckIn
from schemas.checkin import CheckInCreate, CheckInResponse, CheckOutRequest
from utils.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=CheckInResponse)
async def create_checkin(
    checkin_data: CheckInCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if gym exists and is active
    gym = db.query(Gym).filter(
        Gym.id == checkin_data.gym_id,
        Gym.is_active == True
    ).first()
    
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gym not found or inactive"
        )
    
    # Check if user already has an active check-in
    active_checkin = db.query(CheckIn).filter(
        CheckIn.user_id == current_user.id,
        CheckIn.is_active == True
    ).first()
    
    if active_checkin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active check-in. Please check out first."
        )
    
    # Check gym capacity
    if gym.current_occupancy >= gym.max_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gym is at full capacity"
        )
    
    # Create check-in
    checkin = CheckIn(
        user_id=current_user.id,
        gym_id=checkin_data.gym_id,
        is_active=True
    )
    
    # Update gym occupancy
    gym.current_occupancy += 1
    
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    
    return checkin


@router.post("/checkout", response_model=CheckInResponse)
async def checkout(
    checkout_data: CheckOutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find the active check-in
    checkin = db.query(CheckIn).filter(
        CheckIn.id == checkout_data.checkin_id,
        CheckIn.user_id == current_user.id,
        CheckIn.is_active == True
    ).first()
    
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active check-in not found"
        )
    
    # Update check-in
    checkin.checkout_time = datetime.utcnow()
    checkin.is_active = False
    
    # Update gym occupancy
    gym = db.query(Gym).filter(Gym.id == checkin.gym_id).first()
    if gym and gym.current_occupancy > 0:
        gym.current_occupancy -= 1
    
    db.commit()
    db.refresh(checkin)
    
    return checkin


@router.get("/active", response_model=CheckInResponse)
async def get_active_checkin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checkin = db.query(CheckIn).filter(
        CheckIn.user_id == current_user.id,
        CheckIn.is_active == True
    ).first()
    
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active check-in found"
        )
    
    return checkin


@router.get("/", response_model=List[CheckInResponse])
async def get_user_checkins(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    checkins = db.query(CheckIn).filter(
        CheckIn.user_id == current_user.id
    ).order_by(CheckIn.checkin_time.desc()).limit(limit).all()
    
    return checkins
