import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.featherless import check_compliance

logger = logging.getLogger("ruralyield.routes.compliance")

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


class ComplianceCheckRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


@router.post("/check")
async def run_compliance_check(request: ComplianceCheckRequest):
    """Send text to Featherless.AI for compliance analysis."""
    try:
        result = await check_compliance(request.text)
        return {"success": True, "compliance": result}
    except Exception as exc:
        logger.exception("Compliance check failed")
        raise HTTPException(status_code=500, detail=str(exc))
