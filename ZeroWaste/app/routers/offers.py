from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status, Query
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc
import os
import uuid
from pathlib import Path

from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.offer import Offer as OfferModel
from ZeroWaste.app.models.category import Category
from ZeroWaste.app.schemas.offer import Offer, OfferCreate, OfferUpdate

from ZeroWaste.app.core.deps import get_current_user, verify_offer_owner
from ZeroWaste.app.models.user import User as UserModel

from pydantic import BaseModel

router = APIRouter(
    prefix="/offers",
    tags=["offers"]
)

class PaginatedOffers(BaseModel):
    items: List[Offer]
    page: int
    page_size: int
    total: int


@router.get("/", response_model=PaginatedOffers)
def get_offers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    category_id: int | None = None,
    location: str | None = None,
    owner_id: int | None = None,
    title: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        query = db.query(OfferModel)

        if category_id is not None:
            query = query.filter(OfferModel.category_id == category_id)

        if owner_id is not None:
            query = query.filter(OfferModel.owner_id == owner_id)

        if location:
            query = query.filter(OfferModel.location.ilike(f"%{location}%"))

        if title:
            query = query.filter(OfferModel.title.ilike(f"%{title}%"))

        total = query.count()

        offers = (
            query
            .order_by(desc(OfferModel.id))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return {
            "items": offers,
            "page": page,
            "page_size": page_size,
            "total": total
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch offers"
        )


@router.get("/{offer_id}", response_model=Offer)
def get_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(OfferModel).filter(OfferModel.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


@router.post("/", response_model=Offer, status_code=201)
def create_offer(
    offer_data: OfferCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.get(Category, offer_data.category_id)
    if category is None:
        raise HTTPException(status_code=400, detail="Category does not exist")

    new_offer = OfferModel(**offer_data.dict(), owner_id=current_user.id)
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)
    return new_offer


@router.put("/{offer_id}", response_model=Offer)
def update_offer(
    offer_id: int,
    offer_data: OfferUpdate,
    current_user: UserModel = Depends(get_current_user),
    offer: OfferModel = Depends(verify_offer_owner),
    db: Session = Depends(get_db)
):
    data = offer_data.dict(exclude_unset=True)

    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided for update"
        )

    for key, value in data.items():
        setattr(offer, key, value)

    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/{offer_id}")
def delete_offer(
    offer_id: int,
    current_user: UserModel = Depends(get_current_user),
    offer: OfferModel = Depends(verify_offer_owner),
    db: Session = Depends(get_db),
):
    if offer.image_url:
        file_path = Path(offer.image_url.lstrip("/"))
        if file_path.exists():
            file_path.unlink()

    try:
        db.delete(offer)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
    return {"detail": "Offer deleted"}


@router.post("/{offer_id}/image")
def upload_offer_image(
    offer_id: int,
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    offer: OfferModel = Depends(verify_offer_owner),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"

    upload_dir = "media/offers"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    offer.image_url = f"/media/offers/{filename}"
    db.commit()
    db.refresh(offer)

    return {
        "detail": "Image uploaded",
        "image_url": offer.image_url
    }