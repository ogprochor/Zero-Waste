from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from pathlib import Path
import shutil

from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.user import User as UserModel
from ZeroWaste.app.schemas.user import User, UserUpdate
from ZeroWaste.app.core.security import hash_password
from ZeroWaste.app.core.deps import get_current_user
from pydantic import BaseModel

AVATAR_DIR = Path("ZeroWaste/app/static/avatars")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


@router.get("/", response_model=List[User])
def get_users(db: Session = Depends(get_db)):
    return db.query(UserModel).all()


@router.get("/search")
def search_users(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db)
):
    query = query.strip()

    if len(query) < 2:
        return []

    users = (
        db.query(UserModel)
        .filter(
            or_(
                UserModel.username.ilike(f"%{query}%"),
                UserModel.email.ilike(f"%{query}%"),
                UserModel.bio.ilike(f"%{query}%")
            )
        )
        .order_by(UserModel.username.asc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "phone": user.phone,
        }
        for user in users
    ]


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


@router.get("/{user_id}/phone_number")
def get_phone(user_id: int, db: Session = Depends(get_db)):
    user = db.get(UserModel, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not user.phone:
        raise HTTPException(
            status_code=404,
            detail="Phone not found"
        )

    return {"phone_number": user.phone}


class UpdatePhoneRequest(BaseModel):
    phone: str


@router.patch("/{user_id}/phone")
def update_phone(user_id: int, data: UpdatePhoneRequest, db: Session = Depends(get_db)):
    user = db.get(UserModel, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.phone = data.phone
    db.commit()
    db.refresh(user)

    return {"phone": user.phone}


@router.post("/{user_id}/follow")
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    user_to_follow = db.get(UserModel, user_id)

    if not user_to_follow:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_follow.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    if user_to_follow in current_user.following:
        return {"detail": "Already following"}

    current_user.following.append(user_to_follow)
    db.commit()

    return {"detail": "Followed"}


@router.delete("/{user_id}/follow")
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    user_to_unfollow = db.get(UserModel, user_id)

    if not user_to_unfollow:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_unfollow in current_user.following:
        current_user.following.remove(user_to_unfollow)
        db.commit()

    return {"detail": "Unfollowed"}


@router.get("/{user_id}/followers")
def get_followers(user_id: int, db: Session = Depends(get_db)):
    user = db.get(UserModel, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return [
        {
            "id": u.id,
            "username": u.username,
            "bio": u.bio,
            "avatar_url": u.avatar_url
        }
        for u in user.followers
    ]


@router.get("/{user_id}/following")
def get_following(user_id: int, db: Session = Depends(get_db)):
    user = db.get(UserModel, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return [
        {
            "id": u.id,
            "username": u.username,
            "bio": u.bio,
            "avatar_url": u.avatar_url
        }
        for u in user.following
    ]


@router.get("/{user_id}/is-following")
def is_following(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    user = db.get(UserModel, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user in current_user.following