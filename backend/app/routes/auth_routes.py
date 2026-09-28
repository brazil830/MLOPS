"""Kynora Backend — Authentication Routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, RegisterRequest, GoogleAuthRequest, ForgotPasswordRequest, AuthResponse
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        name=req.name,
        email=req.email,
        hashed_password=hash_password(req.password),
        auth_provider="email",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token({"sub": str(user.id)})

    return AuthResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "auth_provider": user.auth_provider},
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.hashed_password:
        raise HTTPException(status_code=401, detail="This account uses Google login. Please sign in with Google.")

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})

    return AuthResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "auth_provider": user.auth_provider},
    )


@router.post("/google", response_model=AuthResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth token."""
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        from app.config import get_settings

        settings = get_settings()
        idinfo = id_token.verify_oauth2_token(req.token, requests.Request(), settings.google_client_id)

        email = idinfo.get("email")
        name = idinfo.get("name", "User")
        google_id = idinfo.get("sub")

        if not email:
            raise HTTPException(status_code=400, detail="Could not get email from Google")

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except ImportError:
        raise HTTPException(status_code=500, detail="Google auth not configured")

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            name=name,
            email=email,
            google_id=google_id,
            auth_provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id)})

    return AuthResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "auth_provider": user.auth_provider},
    )


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset link."""
    # In production, send email with reset token
    user = db.query(User).filter(User.email == req.email).first()
    # Always return success to prevent email enumeration
    return {"message": "If an account exists with that email, a reset link has been sent."}
