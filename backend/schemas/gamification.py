from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserPointsResponse(BaseModel):
    user_id: int
    total_points: int
    level: int
    level_name: str
    points_to_next_level: int
    streak_days: int
    
    class Config:
        from_attributes = True


class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    points_reward: int
    requirement_type: str
    requirement_value: int
    unlocked_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_id: int
    user_name: str
    total_points: int
    level: int
    rank: int
    streak_days: int
    total_checkins: int
    
    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    weekly: List[LeaderboardEntry]
    monthly: List[LeaderboardEntry]
    all_time: List[LeaderboardEntry]


class UserAchievementsResponse(BaseModel):
    unlocked: List[AchievementResponse]
    available: List[AchievementResponse]
    total_points: int
    total_achievements: int


class PointTransactionResponse(BaseModel):
    id: int
    user_id: int
    points: int
    transaction_type: str
    description: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class GamificationStatsResponse(BaseModel):
    user_points: UserPointsResponse
    recent_achievements: List[AchievementResponse]
    leaderboard_position: int
    points_this_week: int
    points_this_month: int
    streak_record: int
