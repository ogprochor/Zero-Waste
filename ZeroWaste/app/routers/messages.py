from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from datetime import datetime

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


def normalize_users(user_a: int, user_b: int) -> tuple[int, int]:
    """Zawsze zapisujemy rozmowę jako mniejszy_id, większy_id."""
    return (min(user_a, user_b), max(user_a, user_b))


def get_conversation_between_users(
    db: Session,
    user_a: int,
    user_b: int
) -> Conversation | None:
    u1, u2 = normalize_users(user_a, user_b)
    return (
        db.query(Conversation)
        .filter(
            Conversation.user1_id == u1,
            Conversation.user2_id == u2
        )
        .first()
    )


def ensure_conversation_between_users(
    db: Session,
    user_a: int,
    user_b: int
) -> Conversation:
    conversation = get_conversation_between_users(db, user_a, user_b)
    if conversation:
        return conversation

    u1, u2 = normalize_users(user_a, user_b)
    conversation = Conversation(user1_id=u1, user2_id=u2)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def assert_conversation_member(conversation: Conversation, user_id: int) -> None:
    if user_id not in [conversation.user1_id, conversation.user2_id]:
        raise HTTPException(status_code=403, detail="Not allowed")


def mark_received_messages_as_read(
    db: Session,
    conversation_id: int,
    current_user_id: int
) -> None:
    """
    Oznacza jako przeczytane tylko wiadomości wysłane przez drugą osobę.
    Dzięki temu nadawca zobaczy potem status `Odczytano`.
    """
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user_id,
        Message.is_read == False  # noqa: E712
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()


def list_messages_for_conversation(db: Session, conversation_id: int) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )


@router.post("/", response_model=MessageResponse)
def send_message(
    data: MessageCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")

    content = data.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    receiver = db.get(UserModel, data.receiver_id)
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    conversation = ensure_conversation_between_users(
        db=db,
        user_a=current_user.id,
        user_b=data.receiver_id
    )

    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=content,
        is_read=False
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
    conversations = (
        db.query(Conversation)
        .filter(
            or_(
                Conversation.user1_id == current_user.id,
                Conversation.user2_id == current_user.id
            )
        )
        .all()
    )

    result = []

    for conversation in conversations:
        other_user = (
            conversation.user2
            if conversation.user1_id == current_user.id
            else conversation.user1
        )

        last_message = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(desc(Message.created_at), desc(Message.id))
            .first()
        )

        unread_count = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation.id,
                Message.sender_id != current_user.id,
                Message.is_read == False  # noqa: E712
            )
            .count()
        )

        result.append({
            "id": conversation.id,
            "other_user": other_user,
            "last_message": last_message.content if last_message else None,
            "last_message_time": last_message.created_at if last_message else None,
            "unread_count": unread_count
        })

    result.sort(
        key=lambda item: item["last_message_time"] or datetime.min,
        reverse=True
    )

    return result


@router.get("/with-user/{other_user_id}", response_model=list[MessageResponse])
def get_messages_with_user(
    other_user_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot open conversation with yourself")

    other_user = db.get(UserModel, other_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    conversation = get_conversation_between_users(
        db=db,
        user_a=current_user.id,
        user_b=other_user_id
    )

    if not conversation:
        return []

    mark_received_messages_as_read(
        db=db,
        conversation_id=conversation.id,
        current_user_id=current_user.id
    )

    return list_messages_for_conversation(db, conversation.id)


@router.get("/conversations/{conversation_id}", response_model=list[MessageResponse])
def get_messages(
    conversation_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = db.get(Conversation, conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    assert_conversation_member(conversation, current_user.id)

    mark_received_messages_as_read(
        db=db,
        conversation_id=conversation_id,
        current_user_id=current_user.id
    )

    return list_messages_for_conversation(db, conversation_id)