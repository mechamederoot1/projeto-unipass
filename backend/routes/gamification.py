from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from database.connection import get_db
from models.user import User
from models.checkin import CheckIn
from models.gamification import Achievement, UserAchievement, UserPoints, PointHistory
from models.audit import AuditLog
from utils.auth import get_current_user

router = APIRouter()


@router.get("/points")
async def get_user_points(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current points and level"""
    
    user_points = db.query(UserPoints).filter(
        UserPoints.user_id == current_user.id
    ).first()
    
    if not user_points:
        # Create initial points record
        user_points = UserPoints(user_id=current_user.id)
        db.add(user_points)
        db.commit()
        db.refresh(user_points)
    
    return {
        "total_points": user_points.total_points,
        "level": user_points.level,
        "current_streak": user_points.current_streak,
        "longest_streak": user_points.longest_streak,
        "points_to_next_level": user_points.points_to_next_level,
        "last_checkin_date": user_points.last_checkin_date
    }


@router.get("/achievements")
async def get_user_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's achievements"""
    
    # Get all achievements
    all_achievements = db.query(Achievement).filter(
        Achievement.is_active == True
    ).all()
    
    # Get user's earned achievements
    user_achievements = db.query(UserAchievement).filter(
        UserAchievement.user_id == current_user.id
    ).all()
    
    earned_achievement_ids = {ua.achievement_id for ua in user_achievements}
    
    achievements_data = []
    for achievement in all_achievements:
        is_earned = achievement.id in earned_achievement_ids
        earned_date = None
        
        if is_earned:
            user_achievement = next(ua for ua in user_achievements if ua.achievement_id == achievement.id)
            earned_date = user_achievement.earned_at
        
        # Check progress for non-earned achievements
        progress = 0
        if not is_earned:
            progress = calculate_achievement_progress(current_user.id, achievement, db)
        
        achievements_data.append({
            "id": achievement.id,
            "name": achievement.name,
            "description": achievement.description,
            "icon": achievement.icon,
            "points_reward": achievement.points_reward,
            "condition_type": achievement.condition_type,
            "condition_value": achievement.condition_value,
            "is_earned": is_earned,
            "earned_at": earned_date,
            "progress": progress,
            "progress_percentage": min(100, (progress / achievement.condition_value) * 100) if achievement.condition_value > 0 else 0
        })
    
    return {"achievements": achievements_data}


@router.get("/leaderboard")
async def get_leaderboard(
    period: str = "all_time",  # all_time, monthly, weekly
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get points leaderboard"""
    
    if period == "monthly":
        start_date = datetime.utcnow().replace(day=1)
        # Get points earned this month
        query = db.query(
            UserPoints.user_id,
            User.name,
            func.sum(PointHistory.points_change).label('points')
        ).join(User).join(PointHistory).filter(
            PointHistory.created_at >= start_date,
            PointHistory.points_change > 0
        ).group_by(UserPoints.user_id, User.name)
    elif period == "weekly":
        start_date = datetime.utcnow() - timedelta(days=7)
        query = db.query(
            UserPoints.user_id,
            User.name,
            func.sum(PointHistory.points_change).label('points')
        ).join(User).join(PointHistory).filter(
            PointHistory.created_at >= start_date,
            PointHistory.points_change > 0
        ).group_by(UserPoints.user_id, User.name)
    else:
        # All time
        query = db.query(
            UserPoints.user_id,
            User.name,
            UserPoints.total_points.label('points'),
            UserPoints.level
        ).join(User)
    
    leaderboard = query.order_by(
        query.column_descriptions[-1]['entity'].desc() if period != "all_time" else UserPoints.total_points.desc()
    ).limit(limit).all()
    
    # Find current user's position
    user_position = None
    for i, entry in enumerate(leaderboard):
        if entry.user_id == current_user.id:
            user_position = i + 1
            break
    
    leaderboard_data = []
    for i, entry in enumerate(leaderboard):
        leaderboard_data.append({
            "position": i + 1,
            "user_id": entry.user_id,
            "name": entry.name,
            "points": int(entry.points),
            "level": getattr(entry, 'level', None),
            "is_current_user": entry.user_id == current_user.id
        })
    
    return {
        "leaderboard": leaderboard_data,
        "current_user_position": user_position,
        "period": period
    }


@router.post("/checkin-points")
async def award_checkin_points(
    checkin_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Award points for a check-in"""
    
    # Verify check-in belongs to user
    checkin = db.query(CheckIn).filter(
        CheckIn.id == checkin_id,
        CheckIn.user_id == current_user.id
    ).first()
    
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check-in not found"
        )
    
    # Get or create user points
    user_points = db.query(UserPoints).filter(
        UserPoints.user_id == current_user.id
    ).first()
    
    if not user_points:
        user_points = UserPoints(user_id=current_user.id)
        db.add(user_points)
        db.flush()
    
    # Calculate points for check-in
    base_points = 10
    
    # Bonus for consecutive days
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    # Check if user checked in yesterday
    yesterday_checkin = db.query(CheckIn).filter(
        CheckIn.user_id == current_user.id,
        func.date(CheckIn.checkin_time) == yesterday
    ).first()
    
    if yesterday_checkin:
        user_points.current_streak += 1
        if user_points.current_streak > user_points.longest_streak:
            user_points.longest_streak = user_points.current_streak
        
        # Streak bonus
        streak_bonus = min(user_points.current_streak * 2, 20)  # Max 20 bonus points
        base_points += streak_bonus
    else:
        # Reset streak if not consecutive
        if user_points.last_checkin_date and user_points.last_checkin_date.date() != yesterday:
            user_points.current_streak = 1
    
    user_points.last_checkin_date = checkin.checkin_time
    
    # Add points and check for level up
    level_up = user_points.add_points(base_points)
    
    # Create point history
    point_history = PointHistory(
        user_points_id=user_points.id,
        points_change=base_points,
        reason="CHECKIN",
        description=f"Check-in points + streak bonus",
        related_entity_type="CHECKIN",
        related_entity_id=checkin_id
    )
    db.add(point_history)
    
    # Check for achievements
    new_achievements = check_and_award_achievements(current_user.id, db)
    
    db.commit()
    
    return {
        "points_awarded": base_points,
        "total_points": user_points.total_points,
        "level": user_points.level,
        "level_up": level_up,
        "current_streak": user_points.current_streak,
        "new_achievements": new_achievements
    }


@router.get("/point-history")
async def get_point_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's point history"""
    
    user_points = db.query(UserPoints).filter(
        UserPoints.user_id == current_user.id
    ).first()
    
    if not user_points:
        return {"history": []}
    
    history = db.query(PointHistory).filter(
        PointHistory.user_points_id == user_points.id
    ).order_by(PointHistory.created_at.desc()).limit(limit).all()
    
    history_data = []
    for entry in history:
        history_data.append({
            "id": entry.id,
            "points_change": entry.points_change,
            "reason": entry.reason,
            "description": entry.description,
            "created_at": entry.created_at
        })
    
    return {"history": history_data}


def calculate_achievement_progress(user_id: int, achievement: Achievement, db: Session) -> int:
    """Calculate user's progress towards an achievement"""
    
    if achievement.condition_type == "CHECKIN_COUNT":
        return db.query(CheckIn).filter(CheckIn.user_id == user_id).count()
    
    elif achievement.condition_type == "STREAK_DAYS":
        user_points = db.query(UserPoints).filter(UserPoints.user_id == user_id).first()
        return user_points.longest_streak if user_points else 0
    
    elif achievement.condition_type == "UNIQUE_GYMS":
        return db.query(CheckIn.gym_id).filter(CheckIn.user_id == user_id).distinct().count()
    
    return 0


def check_and_award_achievements(user_id: int, db: Session) -> List[dict]:
    """Check and award any new achievements for the user"""
    
    # Get all achievements not yet earned by user
    earned_achievement_ids = db.query(UserAchievement.achievement_id).filter(
        UserAchievement.user_id == user_id
    ).subquery()
    
    unearned_achievements = db.query(Achievement).filter(
        Achievement.is_active == True,
        ~Achievement.id.in_(earned_achievement_ids)
    ).all()
    
    new_achievements = []
    
    for achievement in unearned_achievements:
        progress = calculate_achievement_progress(user_id, achievement, db)
        
        if progress >= achievement.condition_value:
            # Award achievement
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id
            )
            db.add(user_achievement)
            
            # Award points
            if achievement.points_reward > 0:
                user_points = db.query(UserPoints).filter(UserPoints.user_id == user_id).first()
                if user_points:
                    user_points.add_points(achievement.points_reward)
                    
                    # Create point history
                    point_history = PointHistory(
                        user_points_id=user_points.id,
                        points_change=achievement.points_reward,
                        reason="ACHIEVEMENT",
                        description=f"Achievement unlocked: {achievement.name}",
                        related_entity_type="ACHIEVEMENT",
                        related_entity_id=achievement.id
                    )
                    db.add(point_history)
            
            new_achievements.append({
                "id": achievement.id,
                "name": achievement.name,
                "description": achievement.description,
                "icon": achievement.icon,
                "points_reward": achievement.points_reward
            })
    
    return new_achievements
