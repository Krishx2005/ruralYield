import logging
from fastapi import APIRouter
from services.activity import get_activity

logger = logging.getLogger("ruralyield.routes.activity")
router = APIRouter(prefix="/api/activity", tags=["activity"])

@router.get("")
async def get_activity_feed(limit: int = 20):
    events = await get_activity(limit=limit)
    return {"success": True, "events": events, "count": len(events)}
