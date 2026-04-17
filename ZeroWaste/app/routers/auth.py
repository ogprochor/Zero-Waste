from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from urllib.parse import urlencode, quote
from urllib.request import urlopen, Request as UrlRequest
from urllib.error import HTTPError
import json
import os
import secrets

from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.user import User as UserModel
from ZeroWaste.app.schemas.user import UserCreate, User, UserLogin
from ZeroWaste.app.schemas.token import Token
from ZeroWaste.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
)
from ZeroWaste.app.core.deps import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login-json",
    auto_error=False
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4200")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", "")


def get_base_url(request: Request) -> str:
    return f"{request.url.scheme}://{request.url.netloc}"


def json_get(url: str):
    req = UrlRequest(url, headers={"Accept": "application/json"})
    with urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def json_post(url: str, payload: dict):
    data = urlencode(payload).encode("utf-8")
    req = UrlRequest(
        url,
        data=data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        method="POST",
    )
    with urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def get_or_create_oauth_user(db: Session, email: str, username: str):
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if user:
        return user

    base_username = username or email.split("@")[0]
    safe_username = "".join(ch for ch in base_username if ch.isalnum() or ch in "_.-")[:30]
    if not safe_username:
        safe_username = "user"

    candidate = safe_username
    counter = 1
    while db.query(UserModel).filter(UserModel.username == candidate).first():
        suffix = str(counter)
        candidate = f"{safe_username[:30-len(suffix)-1]}_{suffix}"
        counter += 1

    new_user = UserModel(
        username=candidate,
        email=email,
        hashed_password=hash_password(secrets.token_urlsafe(32))
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def build_frontend_redirect(user: UserModel):
    access_token = create_access_token(data={"sub": str(user.id)})
    params = urlencode({
        "token": access_token,
        "id": user.id,
        "username": user.username,
        "email": user.email,
    })
    return f"{FRONTEND_URL}/auth/social-callback?{params}"


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(UserModel)
        .filter(
            (user_data.email == UserModel.email) |
            (UserModel.username == user_data.username)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )

    new_user = UserModel(
        username=user_data.username,
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=hash_password(user_data.password)
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise

    return new_user


def authenticate_user(email: str, password: str, db: Session):
    user = db.query(UserModel).filter(UserModel.email == email).first()

    if not user or not verify_password(password, user.hashed_password):
        return None

    return user


@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(form_data.username, form_data.password, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }


@router.post("/login-json", response_model=Token)
def login_user_json(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == data.email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }


@router.get("/me", response_model=User)
def get_current_user_profile(current_user: UserModel = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    email = (payload.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = db.query(UserModel).filter(UserModel.email == email).first()

    response_message = {
        "message": "Jeśli konto istnieje, link do resetu został wygenerowany."
    }

    if not user:
        return response_message

    reset_token = create_access_token(
        data={"sub": str(user.id), "purpose": "reset_password"},
        expires_delta=timedelta(minutes=30)
    )

    reset_link = f"{FRONTEND_URL}/reset-password?token={quote(reset_token)}"

    print("\n===== RESET PASSWORD LINK =====")
    print(f"Dla użytkownika: {user.email}")
    print(reset_link)
    print("===== RESET PASSWORD LINK =====\n")

    return response_message


@router.post("/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    token = payload.get("token")
    password = payload.get("password")

    if not token or not password:
        raise HTTPException(status_code=400, detail="Token and password are required")

    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Nieprawidłowy lub wygasły token")

    if token_data.get("purpose") != "reset_password":
        raise HTTPException(status_code=400, detail="Nieprawidłowy token resetujący")

    user_id = token_data.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Nieprawidłowy token")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Hasło musi mieć co najmniej 8 znaków")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Hasło musi zawierać co najmniej jedną wielką literę")
    special_chars = r'!@#$%^&*(),.?":{}|<>'
    if not any(c in special_chars for c in password):
        raise HTTPException(status_code=400, detail="Hasło musi zawierać co najmniej jeden znak specjalny")

    user = db.query(UserModel).filter(UserModel.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    user.hashed_password = hash_password(password)
    db.commit()

    return {"message": "Hasło zostało zmienione."}


@router.get("/oauth/google/start")
def google_oauth_start(request: Request):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Brak konfiguracji GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET")

    redirect_uri = f"{get_base_url(request)}/auth/oauth/google/callback"

    params = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    })

    return {"redirect_url": f"https://accounts.google.com/o/oauth2/v2/auth?{params}"}


@router.get("/oauth/google/callback")
def google_oauth_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Brak konfiguracji Google OAuth")

    redirect_uri = f"{get_base_url(request)}/auth/oauth/google/callback"

    try:
        token_data = json_post("https://oauth2.googleapis.com/token", {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })

        id_token = token_data.get("id_token")
        if not id_token:
            raise HTTPException(status_code=400, detail="Google nie zwrócił id_token")

        token_info = json_get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={quote(id_token)}"
        )

        if token_info.get("aud") != GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=400, detail="Nieprawidłowy token Google")

        email = token_info.get("email")
        username = token_info.get("name") or (email.split("@")[0] if email else "google_user")

        if not email:
            raise HTTPException(status_code=400, detail="Google nie zwrócił adresu email")

        user = get_or_create_oauth_user(db, email=email, username=username)
        return RedirectResponse(build_frontend_redirect(user))

    except HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {detail}")


@router.get("/oauth/facebook/start")
def facebook_oauth_start(request: Request):
    if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
        raise HTTPException(status_code=500, detail="Brak konfiguracji FACEBOOK_APP_ID / FACEBOOK_APP_SECRET")

    redirect_uri = f"{get_base_url(request)}/auth/oauth/facebook/callback"

    params = urlencode({
        "client_id": FACEBOOK_APP_ID,
        "redirect_uri": redirect_uri,
        "scope": "email,public_profile",
        "response_type": "code",
    })

    return {"redirect_url": f"https://www.facebook.com/v23.0/dialog/oauth?{params}"}


@router.get("/oauth/facebook/callback")
def facebook_oauth_callback(code: str, request: Request, db: Session = Depends(get_db)):
    if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
        raise HTTPException(status_code=500, detail="Brak konfiguracji Facebook OAuth")

    redirect_uri = f"{get_base_url(request)}/auth/oauth/facebook/callback"

    try:
        token_data = json_get(
            "https://graph.facebook.com/v23.0/oauth/access_token?"
            + urlencode({
                "client_id": FACEBOOK_APP_ID,
                "client_secret": FACEBOOK_APP_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            })
        )

        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Facebook nie zwrócił access token")

        profile = json_get(
            "https://graph.facebook.com/me?"
            + urlencode({
                "fields": "id,name,email",
                "access_token": access_token,
            })
        )

        email = profile.get("email")
        username = profile.get("name") or "facebook_user"

        if not email:
            raise HTTPException(
                status_code=400,
                detail="Facebook nie zwrócił email. Upewnij się, że konto Facebook ma email i aplikacja ma uprawnienie email."
            )

        user = get_or_create_oauth_user(db, email=email, username=username)
        return RedirectResponse(build_frontend_redirect(user))

    except HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=400, detail=f"Facebook OAuth error: {detail}")


@router.get("/oauth/google/start-frontend")
def google_oauth_start_frontend(request: Request):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Brak konfiguracji GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET")

    redirect_uri = f"{get_base_url(request)}/auth/oauth/google/callback"

    params = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    })

    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/oauth/facebook/start-frontend")
def facebook_oauth_start_frontend(request: Request):
    if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
        raise HTTPException(status_code=500, detail="Brak konfiguracji FACEBOOK_APP_ID / FACEBOOK_APP_SECRET")

    redirect_uri = f"{get_base_url(request)}/auth/oauth/facebook/callback"

    params = urlencode({
        "client_id": FACEBOOK_APP_ID,
        "redirect_uri": redirect_uri,
        "scope": "email,public_profile",
        "response_type": "code",
    })

    return RedirectResponse(f"https://www.facebook.com/v23.0/dialog/oauth?{params}")