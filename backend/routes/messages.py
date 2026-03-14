import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.activity import log_activity
from services.dynamodb import get_bond

logger = logging.getLogger("ruralyield.routes.messages")
router = APIRouter(prefix="/api/bonds", tags=["messages"])

_messages: dict = {}  # bond_id -> list of messages

class MessageCreate(BaseModel):
    sender_id: str = Field(...)
    sender_name: str = Field(default="Anonymous")
    sender_role: str = Field(default="INVESTOR")  # FARMER or INVESTOR
    content: str = Field(..., min_length=1, max_length=500)
    is_update: bool = Field(default=False)

@router.post("/{bond_id}/messages")
async def post_message(bond_id: str, msg: MessageCreate):
    bond = await get_bond(bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")

    message = {
        "message_id": str(uuid.uuid4()),
        "bond_id": bond_id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "content": msg.content,
        "is_update": msg.is_update,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if bond_id not in _messages:
        _messages[bond_id] = []
    _messages[bond_id].append(message)

    # Log to activity feed
    if msg.is_update:
        await log_activity("farmer_update", f"Farmer {msg.sender_name} posted an update on '{bond.get('title', 'bond')}'", bond_id)
    else:
        await log_activity("investor_question", f"Investor asked a question on '{bond.get('title', 'bond')}'", bond_id)

    return {"success": True, **message}

@router.get("/{bond_id}/messages")
async def get_messages(bond_id: str):
    msgs = _messages.get(bond_id, [])
    return {"success": True, "messages": msgs, "count": len(msgs)}

@router.post("/{bond_id}/updates")
async def post_update(bond_id: str, msg: MessageCreate):
    msg.is_update = True
    msg.sender_role = "FARMER"
    return await post_message(bond_id, msg)
