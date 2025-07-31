#!/usr/bin/env python3
"""
Database initialization script for Unipass
Creates tables and inserts sample data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import init_db, SessionLocal
from models.user import User
from models.gym import Gym
from models.checkin import CheckIn


def main():
    print("Initializing Unipass database...")
    
    # Initialize database (create tables and sample data)
    init_db()
    
    # Verify data was created
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        gym_count = db.query(Gym).count()
        checkin_count = db.query(CheckIn).count()
        
        print(f"Database initialized successfully!")
        print(f"- Users: {user_count}")
        print(f"- Gyms: {gym_count}")
        print(f"- Check-ins: {checkin_count}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
