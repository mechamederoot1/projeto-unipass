from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn

from database.connection import init_db
from routes import auth, users, gyms, checkins, admin, gamification, gym_admin, subscriptions
from utils.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Unipass API",
    description="API para sistema de check-in em academias",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(gyms.router, prefix="/api/gyms", tags=["Gyms"])
app.include_router(checkins.router, prefix="/api/checkins", tags=["Check-ins"])

# New advanced routers
from routes import gym_admin, admin, subscriptions, gamification
app.include_router(gym_admin.router, prefix="/api/gym-admin", tags=["Gym Administration"])
app.include_router(admin.router, prefix="/api/admin", tags=["System Administration"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["Gamification"])


@app.get("/")
async def root():
    return {"message": "Unipass API v1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "unipass-api"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
