from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, VerifyOTPRequest, LoginRequest, TokenResponse
from app.schemas.user import UserPrivate
from app.services.auth_service import hash_password, create_access_token
from app.dependencies import get_current_user

MOCK_OTP = "123456"
router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=body.username,
        phone_number=body.phone_number,
        display_name=body.display_name,
        password_hash=hash_password(MOCK_OTP),
    )
    db.add(user)
    await db.commit()
    return {"message": "OTP sent", "dev_hint": "Use 123456"}

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    if body.otp != MOCK_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    query = select(User)
    if body.username:
        query = query.where(User.username == body.username)
    elif body.phone_number:
        query = query.where(User.phone_number == body.phone_number)
    else:
        raise HTTPException(status_code=400, detail="Provide username or phone_number")
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return TokenResponse(access_token=create_access_token({"sub": str(user.id)}))

@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "OTP sent", "dev_hint": "Use 123456"}

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out"}

@router.get("/me", response_model=UserPrivate)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
