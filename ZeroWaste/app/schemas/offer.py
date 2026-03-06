from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal


class OfferBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    category_id: int
    price: Optional[float] = None


class OfferCreate(OfferBase):
    pass


class OfferUpdate(OfferBase):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    category_id: Optional[int] = None


class Offer(OfferBase):
    id: int
    owner_id: Optional[int] = None


    class Config:
        from_attributes = True
