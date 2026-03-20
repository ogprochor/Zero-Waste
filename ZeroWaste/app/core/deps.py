from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.user import User as UserModel
from ZeroWaste.app.models.offer import Offer as OfferModel
from ZeroWaste.app.core.security import verify_token, get_user_id_from_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
) -> UserModel:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Weryfikacja tokena
    user_id = get_user_id_from_token(token)
    if user_id is None:
        raise credentials_exception

    # Pobranie użytkownika z bazy
    user = db.get(UserModel, user_id)
    if user is None:
        raise credentials_exception

    print("TOKEN USER ID:", user.id)
    print("TOKEN EMAIL:", user.email)

    return user


def get_current_active_user(
        current_user: UserModel = Depends(get_current_user)
) -> UserModel:

    return current_user


def verify_offer_owner(
        offer_id: int,
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
) -> OfferModel:

    offer = db.get(OfferModel, offer_id)
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )

    if offer.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify this offer"
        )

    return offer