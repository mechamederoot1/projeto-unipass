import sqlite3
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database configuration
DATABASE_URL = "sqlite:///./unipass.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database and create tables"""
    from models.user import User
    from models.gym import Gym
    from models.checkin import CheckIn
    from models.admin import AdminUser
    from models.subscription import Plan, Subscription, Payment
    from models.audit import AuditLog
    from models.gamification import Achievement, UserAchievement, UserPoints, PointHistory
    from models.support import SupportTicket, TicketMessage, GymReview, ReviewHelpful
    from models.features import Coupon, CouponUsage, Equipment, Reservation, ClassSchedule

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Insert sample data if database is empty
    db = SessionLocal()
    try:
        if db.query(Gym).count() == 0:
            _create_sample_data(db)
    finally:
        db.close()

def _create_sample_data(db):
    """Create sample data for development"""
    from models.gym import Gym
    from models.user import User
    from models.admin import AdminUser, UserRole
    from models.subscription import Plan, Subscription, PlanType, SubscriptionStatus
    from models.gamification import Achievement, UserPoints
    from models.features import Equipment, EquipmentType, ClassSchedule
    from datetime import datetime, timedelta
    import json
    
    # Sample gyms
    gyms = [
        Gym(
            name="Smart Fit Centro",
            address="Rua das Flores, 123 - Centro, São Paulo - SP",
            phone="(11) 3333-4444",
            latitude=-23.5505,
            longitude=-46.6333,
            open_hours_weekdays="6h às 22h",
            open_hours_weekends="8h às 18h",
            amenities="Wifi Grátis,Estacionamento,Chuveiros,Café",
            description="Academia completa com equipamentos modernos e ambiente climatizado.",
            max_capacity=80,
            current_occupancy=45,
            is_active=True
        ),
        Gym(
            name="Academia Forma",
            address="Av. Paulista, 456 - Bela Vista, São Paulo - SP", 
            phone="(11) 2222-3333",
            latitude=-23.5616,
            longitude=-46.6562,
            open_hours_weekdays="24 horas",
            open_hours_weekends="24 horas",
            amenities="Wifi Grátis,Estacionamento,Chuveiros",
            description="Academia 24 horas com foco em musculação e funcional.",
            max_capacity=60,
            current_occupancy=20,
            is_active=True
        ),
        Gym(
            name="Bio Ritmo",
            address="Rua Augusta, 789 - Consolação, São Paulo - SP",
            phone="(11) 1111-2222", 
            latitude=-23.5584,
            longitude=-46.6623,
            open_hours_weekdays="6h às 20h",
            open_hours_weekends="8h às 16h",
            amenities="Wifi Grátis,Chuveiros,Café,Aulas em Grupo",
            description="Foco em aulas funcionais e bem-estar.",
            max_capacity=50,
            current_occupancy=15,
            is_active=True
        )
    ]
    
    for gym in gyms:
        db.add(gym)
    
    # Sample user
    sample_user = User(
        name="João Silva",
        email="joao.silva@email.com",
        phone="(11) 99999-9999",
        password_hash="$2b$12$dummy_hash_for_development",
        is_active=True
    )
    db.add(sample_user)
    db.commit()

    # Create subscription plans
    plans = [
        Plan(
            name="Básico",
            description="Acesso limitado a academias selecionadas",
            plan_type=PlanType.BASIC,
            price_monthly=29.90,
            price_yearly=299.00,
            max_checkins_per_month=8,
            max_gyms_access=50,
            features=json.dumps([
                "8 check-ins por mês",
                "Acesso a 50+ academias",
                "App mobile",
                "Suporte básico"
            ])
        ),
        Plan(
            name="Premium",
            description="Acesso premium com mais benefícios",
            plan_type=PlanType.PREMIUM,
            price_monthly=49.90,
            price_yearly=499.00,
            max_checkins_per_month=20,
            max_gyms_access=200,
            features=json.dumps([
                "20 check-ins por mês",
                "Acesso a 200+ academias",
                "Reserva de equipamentos",
                "Suporte prioritário",
                "Relatórios avançados"
            ])
        ),
        Plan(
            name="Ilimitado",
            description="Acesso total sem restrições",
            plan_type=PlanType.UNLIMITED,
            price_monthly=79.90,
            price_yearly=799.00,
            max_checkins_per_month=None,
            max_gyms_access=None,
            features=json.dumps([
                "Check-ins ilimitados",
                "Acesso a todas as academias",
                "Reserva prioritária",
                "Suporte VIP 24/7",
                "Análises personalizadas",
                "Descontos em produtos"
            ])
        )
    ]

    for plan in plans:
        db.add(plan)
    db.commit()

    # Create admin user
    admin_user = AdminUser(
        user_id=sample_user.id,
        role=UserRole.SUPER_ADMIN,
        permissions=json.dumps([
            "manage_users", "manage_gyms", "manage_plans",
            "view_analytics", "manage_support", "system_admin"
        ])
    )
    db.add(admin_user)

    # Create sample subscription for user
    user_subscription = Subscription(
        user_id=sample_user.id,
        plan_id=plans[1].id,  # Premium plan
        status=SubscriptionStatus.ACTIVE,
        end_date=datetime.utcnow() + timedelta(days=30),
        is_yearly=False,
        next_billing_date=datetime.utcnow() + timedelta(days=30)
    )
    db.add(user_subscription)

    # Create user points
    user_points = UserPoints(
        user_id=sample_user.id,
        total_points=150,
        current_streak=5,
        longest_streak=12,
        level=2
    )
    db.add(user_points)

    # Create achievements
    achievements = [
        Achievement(
            name="Primeiro Check-in",
            description="Faça seu primeiro check-in em uma academia",
            icon="first-checkin",
            points_reward=10,
            condition_type="CHECKIN_COUNT",
            condition_value=1
        ),
        Achievement(
            name="Frequentador Assíduo",
            description="Faça check-in por 7 dias consecutivos",
            icon="streak-7",
            points_reward=50,
            condition_type="STREAK_DAYS",
            condition_value=7
        ),
        Achievement(
            name="Explorador",
            description="Visite 10 academias diferentes",
            icon="explorer",
            points_reward=100,
            condition_type="UNIQUE_GYMS",
            condition_value=10
        ),
        Achievement(
            name="Maratonista",
            description="Complete 100 check-ins",
            icon="marathon",
            points_reward=200,
            condition_type="CHECKIN_COUNT",
            condition_value=100
        )
    ]

    for achievement in achievements:
        db.add(achievement)

    # Create equipment for gyms
    for gym in gyms:
        db.add(gym)
        db.flush()  # Get the gym ID

        equipment_list = [
            Equipment(
                gym_id=gym.id,
                name="Esteira 1",
                equipment_type=EquipmentType.CARDIO,
                description="Esteira profissional com monitor cardíaco",
                is_reservable=True,
                reservation_duration_minutes=30
            ),
            Equipment(
                gym_id=gym.id,
                name="Bicicleta Ergométrica",
                equipment_type=EquipmentType.CARDIO,
                description="Bicicleta com programas de treino",
                is_reservable=True,
                reservation_duration_minutes=30
            ),
            Equipment(
                gym_id=gym.id,
                name="Sala de Musculação",
                equipment_type=EquipmentType.STRENGTH,
                description="Área completa de musculação",
                capacity=20,
                is_reservable=False
            ),
            Equipment(
                gym_id=gym.id,
                name="Sala de Aulas",
                equipment_type=EquipmentType.CLASS_ROOM,
                description="Sala para aulas em grupo",
                capacity=25,
                is_reservable=True,
                reservation_duration_minutes=60
            )
        ]

        for equipment in equipment_list:
            db.add(equipment)

        # Create class schedules
        class_schedules = [
            ClassSchedule(
                gym_id=gym.id,
                name="Yoga Matinal",
                description="Aula de yoga para começar bem o dia",
                instructor_name="Ana Silva",
                day_of_week=1,  # Tuesday
                start_time="07:00",
                end_time="08:00",
                max_participants=15
            ),
            ClassSchedule(
                gym_id=gym.id,
                name="HIIT",
                description="Treino intervalado de alta intensidade",
                instructor_name="Carlos Santos",
                day_of_week=3,  # Thursday
                start_time="19:00",
                end_time="20:00",
                max_participants=20
            )
        ]

        for schedule in class_schedules:
            db.add(schedule)

    db.commit()
