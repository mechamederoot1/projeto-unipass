#!/usr/bin/env python3
"""
Database maintenance script for Unipass
Handles cleanup, migrations, and data updates
"""

import sys
import os
from datetime import datetime, timedelta
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import SessionLocal
from models.checkin import CheckIn
from models.gym import Gym


def cleanup_old_checkins(days_to_keep: int = 90):
    """Remove check-ins older than specified days"""
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        old_checkins = db.query(CheckIn).filter(
            CheckIn.checkin_time < cutoff_date
        ).count()
        
        if old_checkins > 0:
            db.query(CheckIn).filter(
                CheckIn.checkin_time < cutoff_date
            ).delete()
            db.commit()
            print(f"Removed {old_checkins} old check-ins")
        else:
            print("No old check-ins to remove")
            
    finally:
        db.close()


def force_checkout_stuck_checkins():
    """Force checkout for check-ins older than 4 hours"""
    db = SessionLocal()
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=4)
        stuck_checkins = db.query(CheckIn).filter(
            CheckIn.is_active == True,
            CheckIn.checkin_time < cutoff_time
        ).all()
        
        for checkin in stuck_checkins:
            checkin.is_active = False
            checkin.checkout_time = checkin.checkin_time + timedelta(hours=4)
            
            # Update gym occupancy
            gym = db.query(Gym).filter(Gym.id == checkin.gym_id).first()
            if gym and gym.current_occupancy > 0:
                gym.current_occupancy -= 1
        
        if stuck_checkins:
            db.commit()
            print(f"Force checked out {len(stuck_checkins)} stuck check-ins")
        else:
            print("No stuck check-ins found")
            
    finally:
        db.close()


def reset_gym_occupancy():
    """Reset all gym occupancy to 0 (emergency use only)"""
    db = SessionLocal()
    try:
        gyms = db.query(Gym).all()
        for gym in gyms:
            gym.current_occupancy = 0
        
        db.commit()
        print(f"Reset occupancy for {len(gyms)} gyms")
        
    finally:
        db.close()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Unipass Database Maintenance")
    parser.add_argument("--cleanup-checkins", type=int, metavar="DAYS",
                       help="Remove check-ins older than DAYS (default: 90)")
    parser.add_argument("--force-checkout", action="store_true",
                       help="Force checkout stuck check-ins (older than 4 hours)")
    parser.add_argument("--reset-occupancy", action="store_true",
                       help="Reset all gym occupancy to 0 (emergency use)")
    
    args = parser.parse_args()
    
    if args.cleanup_checkins is not None:
        cleanup_old_checkins(args.cleanup_checkins)
    elif args.cleanup_checkins is None and not any([args.force_checkout, args.reset_occupancy]):
        cleanup_old_checkins()  # Default cleanup
    
    if args.force_checkout:
        force_checkout_stuck_checkins()
    
    if args.reset_occupancy:
        confirm = input("Are you sure you want to reset all gym occupancy? (yes/no): ")
        if confirm.lower() == "yes":
            reset_gym_occupancy()
        else:
            print("Operation cancelled")


if __name__ == "__main__":
    main()
