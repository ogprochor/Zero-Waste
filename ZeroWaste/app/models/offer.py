from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from ZeroWaste.app.db.database import Base


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    # Cena (np. PLN). Nullable, bo oferty mogą być „za darmo”.
    price = Column(Numeric(10, 2), nullable=True)
    image_url = Column(String, nullable=True)
    location = Column(String, nullable=True)

    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable=True

    category = relationship("Category")
    owner = relationship("User", back_populates="offers")
