from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from ZeroWaste.app.db.database import get_db
from ZeroWaste.app.models.message import Message
from ZeroWaste.app.models.conversation import Conversation
from ZeroWaste.app.models.user import User as UserModel

from ZeroWaste.app.schemas.message import MessageCreate, MessageResponse
from ZeroWaste.app.schemas.conversation import ConversationResponse

from ZeroWaste.app.core.deps import get_current_user

router = APIRouter(
    prefix="/messages",
    tags=["messages"]
)


def normalize_users(user_a: int, user_b: int):
    return (min(user_a, user_b), max(user_a, user_b))


@router.post("/", response_model=MessageResponse)
def send_message(
    data: MessageCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")

    # sprawdź czy user istnieje
    receiver = db.get(UserModel, data.receiver_id)
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    u1, u2 = normalize_users(current_user.id, data.receiver_id)

    conversation = db.query(Conversation).filter(Conversation.user1_id == u1, Conversation.user2_id == u2
    ).first()


    if not conversation:
        conversation = Conversation(user1_id=u1, user2_id=u2)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=data.content
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversations = db.query(Conversation).filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).all()

    result = []

    for c in conversations:
        other_user = c.user2 if c.user1_id == current_user.id else c.user1

        last_message = db.query(Message).filter(
            Message.conversation_id == c.id
        ).order_by(desc(Message.created_at)).first()

        unread_count = db.query(Message).filter(
            Message.conversation_id == c.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()

        result.append({
            "id": c.id,
            "other_user": other_user,
            "last_message": last_message.content if last_message else None,
            "last_message_time": last_message.created_at if last_message else None,
            "unread_count": unread_count
        })

    result.sort(
        key=lambda x: x["last_message_time"] or 0,
        reverse=True
    )

    return result


@router.get("/conversations/{conversation_id}", response_model=list[MessageResponse])
def get_messages(
    conversation_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = db.get(Conversation, conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in [conversation.user1_id, conversation.user2_id]:
        raise HTTPException(status_code=403, detail="Not allowed")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()

    # oznaczanie jako przeczytane
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})

    db.commit()

    return messages