from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from database.connection import get_db
from models.gym import Gym
from schemas.gym import GymResponse, GymSearchResponse
from utils.auth import get_current_user_optional

router = APIRouter()


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


@router.get("/", response_model=List[GymSearchResponse])
async def get_gyms(
    db: Session = Depends(get_db),
    lat: Optional[float] = Query(None, description="User latitude for distance calculation"),
    lon: Optional[float] = Query(None, description="User longitude for distance calculation"),
    radius: Optional[float] = Query(10.0, description="Search radius in kilometers"),
    limit: int = Query(50, le=100)
):
    query = db.query(Gym).filter(Gym.is_active == True)
    gyms = query.limit(limit).all()
    
    result = []
    for gym in gyms:
        gym_data = {
            "id": gym.id,
            "name": gym.name,
            "address": gym.address,
            "rating": gym.rating,
            "is_open_now": gym.is_open_now,
            "current_occupancy": gym.current_occupancy,
            "max_capacity": gym.max_capacity,
            "occupancy_percentage": gym.occupancy_percentage
        }
        
        # Calculate distance if user coordinates provided
        if lat is not None and lon is not None:
            distance = calculate_distance(lat, lon, gym.latitude, gym.longitude)
            gym_data["distance"] = round(distance, 2)
            
            # Filter by radius if specified
            if distance > radius:
                continue
        
        result.append(gym_data)
    
    # Sort by distance if coordinates provided
    if lat is not None and lon is not None:
        result.sort(key=lambda x: x.get("distance", float('inf')))
    
    return result


@router.get("/search", response_model=List[GymSearchResponse])
async def search_gyms(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    limit: int = Query(20, le=50)
):
    # Search in name and address
    query = db.query(Gym).filter(
        Gym.is_active == True,
        (Gym.name.ilike(f"%{q}%") | Gym.address.ilike(f"%{q}%"))
    )
    
    gyms = query.limit(limit).all()
    
    result = []
    for gym in gyms:
        gym_data = {
            "id": gym.id,
            "name": gym.name,
            "address": gym.address,
            "rating": gym.rating,
            "is_open_now": gym.is_open_now,
            "current_occupancy": gym.current_occupancy,
            "max_capacity": gym.max_capacity,
            "occupancy_percentage": gym.occupancy_percentage
        }
        
        if lat is not None and lon is not None:
            distance = calculate_distance(lat, lon, gym.latitude, gym.longitude)
            gym_data["distance"] = round(distance, 2)
        
        result.append(gym_data)
    
    return result


@router.get("/{gym_id}", response_model=GymResponse)
async def get_gym(gym_id: int, db: Session = Depends(get_db)):
    gym = db.query(Gym).filter(Gym.id == gym_id, Gym.is_active == True).first()
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gym not found"
        )
    
    return gym
