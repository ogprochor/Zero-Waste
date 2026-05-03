from sqlalchemy import Column, Integer, String, DateTime, Text, Table, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ZeroWaste.app.db.database import Base

followers_table = Table(
    "followers",
    Base.metadata,
    Column("follower_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("following_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    offers = relationship("Offer", back_populates="owner")
    posts = relationship("Post", back_populates="owner")
    bio = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    post_likes = relationship("PostLike", back_populates="user", cascade="all, delete-orphan")
    following = relationship(
        "User",
        secondary=followers_table,
        primaryjoin=id == followers_table.c.follower_id,
        secondaryjoin=id == followers_table.c.following_id,
        backref="followers"
    )