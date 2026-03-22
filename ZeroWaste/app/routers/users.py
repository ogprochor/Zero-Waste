from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from pathlib import Path
import shutil

from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.user import User as UserModel
from ZeroWaste.app.schemas.user import User, UserUpdate
from ZeroWaste.app.core.security import hash_password
from ZeroWaste.app.core.deps import get_current_user

AVATAR_DIR = Path("ZeroWaste/app/static/avatars")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


@router.get("/", response_model=List[User])
def get_users(db: Session = Depends(get_db)):
    return db.query(UserModel).all()


@router.get("/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(UserModel, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own profile"
        )

    user = db.get(UserModel, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user_data.username is not None:
        user.username = user_data.username

    if user_data.email is not None:
        user.email = user_data.email

    if user_data.password is not None and user_data.password.strip() != "":
        user.hashed_password = hash_password(user_data.password)

    if user_data.bio is not None:
        user.bio = user_data.bio

    if user_data.phone is not None:
        user.phone = user_data.phone

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own account"
        )

    user = db.get(UserModel, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        db.delete(user)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"detail": "User deleted"}


@router.put("/{user_id}/avatar", response_model=User)
def upload_or_update_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own avatar"
        )

    user = db.get(UserModel, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: jpg, jpeg, png, webp"
        )

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)

    filename = f"user_{user_id}{ext}"
    file_path = AVATAR_DIR / filename

    if user.avatar_url:
        old_path = Path(user.avatar_url.lstrip("/"))
        if old_path.exists():
            old_path.unlink()

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    user.avatar_url = f"/static/avatars/{filename}"

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user


@router.delete("/{user_id}/avatar")
def delete_avatar(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own avatar"
        )

    user = db.get(UserModel, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no avatar"
        )

    file_path = Path(user.avatar_url.lstrip("/"))
    if file_path.exists():
        file_path.unlink()

    user.avatar_url = None

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"detail": "Avatar deleted"}


@router.get("/{user_id}/avatar")
def get_avatar(user_id: int, db: Session = Depends(get_db)):
    user = db.get(UserModel, user_id)
    if user is None or not user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar not found"
        )

    return {"avatar_url": user.avatar_url}