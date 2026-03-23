from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import timedelta

from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.user import User as UserModel
from ZeroWaste.app.schemas.user import UserCreate, User, UserLogin
from ZeroWaste.app.schemas.token import Token
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from ZeroWaste.app.core.security import (
    hash_password, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
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
            status_code= status.HTTP_400_BAD_REQUEST,
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
            status_code= status.HTTP_400_BAD_REQUEST,
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
def get_current_user_profile(
        current_user: UserModel = Depends(get_current_user)
):
    return current_user

