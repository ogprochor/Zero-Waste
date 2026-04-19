from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.post import Post, PostLike
from ZeroWaste.app.schemas.post import PostCreate, PostOut
from ZeroWaste.app.core.deps import get_current_user
from ZeroWaste.app.models.user import User

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("/", response_model=PostOut)
def create_post(
        post_data: PostCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    post = Post(
        content=post_data.content,
        image_url=post_data.image_url,
        user_id=current_user.id
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/me", response_model=list[PostOut])
def get_my_posts(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return db.query(Post).filter(Post.user_id == current_user.id).order_by(Post.created_at.desc()).all()


@router.get("/", response_model=list[PostOut])
def get_all_posts(db: Session = Depends(get_db)):
    return db.query(Post).order_by(Post.created_at.desc()).all()


@router.get("/user/{user_id}", response_model=list[PostOut])
def get_user_posts(user_id: int, db: Session = Depends(get_db)):
    return db.query(Post).filter(Post.user_id == user_id).order_by(Post.created_at.desc()).all()


@router.put("/{post_id}", response_model=PostOut)
def update_post(
        post_id: int,
        post_data: PostCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")

    post.content = post_data.content
    post.image_url = post_data.image_url
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}")
def delete_post(
        post_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")

    db.delete(post)
    db.commit()
    return {"message": "Post deleted"}

@router.post("/{post_id}/like")
def toggle_like(
        post_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    like = db.query(PostLike).filter(
        PostLike.user_id == current_user.id,
        PostLike.post_id == post_id
    ).first()

    if like:
        db.delete(like)
        db.commit()
        return {"liked": False}
    else:
        new_like = PostLike(user_id=current_user.id, post_id=post_id)
        db.add(new_like)
        db.commit()
        return {"liked": True}


@router.get("/{post_id}/likes-count")
def get_likes_count(
        post_id: int,
        db: Session = Depends(get_db)
):
    return db.query(PostLike).filter(PostLike.post_id == post_id).count()


@router.get("/{post_id}/user-liked")
def get_user_liked(
        post_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    liked = db.query(PostLike).filter(
        PostLike.user_id == current_user.id,
        PostLike.post_id == post_id
    ).first() is not None
    return {"liked": liked}