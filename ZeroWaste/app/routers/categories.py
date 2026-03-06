from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.category import Category as CategoryModel
from ZeroWaste.app.models.offer import Offer as OfferModel
from ZeroWaste.app.schemas.category import Category, CategoryCreate, CategoryUpdate

router = APIRouter(
    prefix="/categories",
    tags=["categories"]
)


@router.get("/", response_model=List[Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(CategoryModel).all()


@router.get("/{category_id}", response_model=Category)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(CategoryModel, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=Category, status_code=201)
def create_category(category_data: CategoryCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(CategoryModel)
        .filter(CategoryModel.name == category_data.name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    new_category = CategoryModel(**category_data.dict())

    try:
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
    except Exception:
        db.rollback()
        raise

    return new_category


@router.put("/{category_id}", response_model=Category)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db)
):
    category = db.get(CategoryModel, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in category_data.dict(exclude_unset=True).items():
        setattr(category, key, value)

    try:
        db.commit()
        db.refresh(category)
    except Exception:
        db.rollback()
        raise

    return category


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(CategoryModel, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    offers_count = (
        db.query(OfferModel)
        .filter(OfferModel.category_id == category_id)
        .count()
    )
    if offers_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with existing offers"
        )

    try:
        db.delete(category)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"detail": "Category deleted"}
