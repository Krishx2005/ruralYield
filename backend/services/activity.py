import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("ruralyield.services.activity")

_activity_log: list = []


async def log_activity(event_type: str, message: str, bond_id: str = "") -> dict:
    entry = {
        "event_id": str(uuid.uuid4()),
        "type": event_type,
        "message": message,
        "bond_id": bond_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _activity_log.insert(0, entry)
    if len(_activity_log) > 100:
        _activity_log[:] = _activity_log[:100]
    return entry


async def get_activity(limit: int = 20) -> list:
    return _activity_log[:limit]
