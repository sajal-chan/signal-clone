from pydantic import BaseModel

class RegisterRequest(BaseModel):
    username: str
    phone_number: str | None = None
    display_name: str

class VerifyOTPRequest(BaseModel):
    username: str | None = None
    phone_number: str | None = None
    otp: str

class LoginRequest(BaseModel):
    username: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
