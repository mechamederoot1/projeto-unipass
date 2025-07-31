import os
from functools import lru_cache
from pydantic import BaseModel, field_validator
from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./unipass.db"
    
    # Security
    SECRET_KEY: str = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # App Settings
    APP_NAME: str = "Unipass API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Location Settings
    MAX_CHECKIN_DISTANCE_METERS: int = 100
    
    # Gamification
    POINTS_PER_CHECKIN: int = 10
    POINTS_PER_REVIEW: int = 5
    STREAK_BONUS_MULTIPLIER: float = 1.5
    
    # Payment Gateway (Mock for now)
    PAYMENT_GATEWAY_URL: str = "https://api.stripe.com/v1"
    PAYMENT_GATEWAY_SECRET: Optional[str] = None
    
    # Notifications
    ENABLE_PUSH_NOTIFICATIONS: bool = True
    FIREBASE_CONFIG_PATH: Optional[str] = None
    
    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: list = ["jpg", "jpeg", "png", "gif"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Cache
    CACHE_TTL_SECONDS: int = 300  # 5 minutes
    
    @field_validator('SECRET_KEY', mode='before')
    @classmethod
    def generate_secret_key(cls, v):
        if v is None:
            # Generate a secure random secret key
            return secrets.token_urlsafe(32)
        return v

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Global settings instance
settings = get_settings()


# Environment-specific settings
def is_development() -> bool:
    return settings.DEBUG


def is_production() -> bool:
    return not settings.DEBUG


# Security helpers
def get_password_hash_settings():
    return {
        "schemes": ["bcrypt"],
        "deprecated": "auto",
        "bcrypt__rounds": 12
    }


# Database settings
def get_database_url() -> str:
    return settings.DATABASE_URL


# JWT settings
def get_jwt_settings():
    return {
        "secret_key": settings.SECRET_KEY,
        "algorithm": settings.ALGORITHM,
        "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "refresh_token_expire_days": settings.REFRESH_TOKEN_EXPIRE_DAYS
    }
