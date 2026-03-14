import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.bedrock import score_risk

logger = logging.getLogger("ruralyield.routes.risk")

router = APIRouter(prefix="/api/risk", tags=["risk"])


class RiskScoreRequest(BaseModel):
    proposal: dict = Field(...)
    usda_data: dict = Field(default_factory=dict)


@router.post("/score")
async def run_risk_score(request: RiskScoreRequest):
    """Send proposal and yield data to Bedrock for risk assessment."""
    try:
        result = await score_risk(request.proposal, request.usda_data)
        return {"success": True, "risk": result}
    except Exception as exc:
        logger.exception("Risk scoring failed")
        raise HTTPException(status_code=500, detail=str(exc))
