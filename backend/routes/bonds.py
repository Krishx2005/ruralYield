import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field

from agent import run_bond_agent
from services.dynamodb import get_bond, list_bonds, update_bond_status, create_ledger_entry
from services.notifications import notify_investment_received, notify_bond_fully_funded
from services.activity import log_activity
from services.s3 import upload_file

logger = logging.getLogger("ruralyield.routes.bonds")


def formatCurrency(amt):
    return f"${amt:,.0f}"

router = APIRouter(prefix="/api/bonds", tags=["bonds"])


class BondProposal(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    crop_type: str = Field(..., min_length=1)
    county: str = Field(..., min_length=1)
    description: str = Field(default="")
    farmer_name: str = Field(default="")
    farmer_email: str = Field(default="")
    farmer_phone: str = Field(default="")


class InvestRequest(BaseModel):
    investor_id: str = Field(default="anonymous")
    investor_name: str = Field(default="Anonymous")
    amount: float = Field(..., gt=0)
    investor_email: str = Field(default="")


@router.post("")
async def create_bond(proposal: BondProposal):
    """Create a new bond proposal and run the agent decision loop."""
    logger.info("New bond proposal: %s", proposal.title)
    try:
        result = await run_bond_agent(proposal.model_dump())
        await log_activity("bond_submitted", f"New bond submitted by {proposal.farmer_name or 'a farmer'} in {proposal.county}", result["bond_id"])
        if result["decision"] == "APPROVED":
            await log_activity("bond_approved", f"Bond '{proposal.title}' was APPROVED", result["bond_id"])
        elif result["decision"] == "REJECTED":
            await log_activity("bond_rejected", f"Bond '{proposal.title}' was REJECTED", result["bond_id"])
        return {
            "success": True,
            "bond_id": result["bond_id"],
            "decision": result["decision"],
            "decision_reason": result["decision_reason"],
            "compliance_score": result["compliance_score"],
            "risk_level": result["risk_level"],
            "risk_score": result["risk_score"],
            "usda_data": result["usda_data"],
            "audit_trail": result["audit_trail"],
            "created_at": result["created_at"],
        }
    except Exception as exc:
        logger.exception("Bond creation failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("")
async def get_all_bonds(limit: int = 50, status: Optional[str] = None):
    """List all bonds with optional status filter."""
    try:
        bonds = await list_bonds(limit=limit, status=status)
        # Check for expired bonds
        now_str = datetime.now(timezone.utc).isoformat()
        for b in bonds:
            if b.get("status") == "APPROVED" and b.get("expires_at", "") < now_str and b.get("expires_at"):
                try:
                    await update_bond_status(b.get("bond_id"), "EXPIRED")
                    await log_activity("bond_expired", f"Bond '{b.get('title', 'bond')}' has expired", b.get("bond_id", ""))
                except Exception:
                    pass
        # Re-fetch after expiration updates
        bonds = await list_bonds(limit=limit, status=status)
        return {"success": True, "bonds": bonds, "count": len(bonds)}
    except Exception as exc:
        logger.exception("Failed to list bonds")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{bond_id}")
async def get_bond_detail(bond_id: str):
    """Get a bond by ID with full audit trail."""
    try:
        bond = await get_bond(bond_id)
        if not bond:
            raise HTTPException(status_code=404, detail="Bond not found")
        return {"success": True, "bond": bond}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to get bond %s", bond_id)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{bond_id}/funding")
async def get_bond_funding(bond_id: str):
    bond = await get_bond(bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")
    funding_goal = bond.get("funding_goal", bond.get("amount", 0))
    amount_raised = bond.get("amount_raised", 0)
    investor_count = bond.get("investor_count", 0)
    percent = min(round((amount_raised / funding_goal * 100) if funding_goal > 0 else 0, 1), 100)
    return {
        "funding_goal": funding_goal,
        "amount_raised": amount_raised,
        "investor_count": investor_count,
        "percent_funded": percent,
    }


@router.put("/{bond_id}/invest")
async def invest_in_bond(bond_id: str, invest: InvestRequest):
    """Record an investor's investment in a bond."""
    try:
        bond = await get_bond(bond_id)
        if not bond:
            raise HTTPException(status_code=404, detail="Bond not found")

        if bond.get("status") != "APPROVED":
            raise HTTPException(
                status_code=400,
                detail=f"Bond status is {bond.get('status')}; only APPROVED bonds accept investments",
            )

        ledger_entry = await create_ledger_entry({
            "bond_id": bond_id,
            "investor_id": invest.investor_id,
            "investor_name": invest.investor_name,
            "amount": invest.amount,
            "type": "INVEST",
        })

        current_raised = bond.get("amount_raised", 0)
        new_raised = current_raised + invest.amount
        current_count = bond.get("investor_count", 0)
        new_count = current_count + 1
        funding_goal = bond.get("funding_goal", bond.get("amount", 0))

        new_status = "APPROVED"  # keep current status
        if new_raised >= funding_goal:
            new_status = "FUNDED"

        await update_bond_status(bond_id, new_status, extra={
            "amount_raised": new_raised,
            "investor_count": new_count,
            "total_invested": new_raised,  # keep backward compat
        })

        await log_activity("investment", f"Investor put {formatCurrency(invest.amount)} into '{bond.get('title', 'bond')}'", bond_id)
        if new_status == "FUNDED":
            await log_activity("bond_funded", f"Bond '{bond.get('title', 'bond')}' is fully funded!", bond_id)

        # Send notifications
        try:
            await notify_investment_received(bond, invest.investor_name, invest.investor_email, invest.amount)
            if new_status == "FUNDED":
                await notify_bond_fully_funded(bond)
        except Exception:
            pass  # Don't fail investment on notification errors

        return {
            "success": True,
            "bond_id": bond_id,
            "investor_id": invest.investor_id,
            "amount": invest.amount,
            "total_invested": new_raised,
            "amount_raised": new_raised,
            "investor_count": new_count,
            "funding_goal": funding_goal,
            "percent_funded": min(round((new_raised / funding_goal * 100) if funding_goal > 0 else 0, 1), 100),
            "status": new_status,
            "ledger_entry_id": ledger_entry.get("entry_id"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Investment failed for bond %s", bond_id)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload-video")
async def upload_bond_video(file: UploadFile = File(...)):
    """Upload a bond pitch video to S3."""
    try:
        contents = await file.read()
        result = await upload_file(contents, file.filename or "pitch.webm")
        return {"success": True, "video_url": result}
    except Exception as exc:
        logger.exception("Video upload failed")
        raise HTTPException(status_code=500, detail=str(exc))


class RepaymentRequest(BaseModel):
    interest_rate: float = Field(default=8.0, ge=1, le=30)
    term_months: int = Field(default=12, ge=1, le=60)


@router.post("/{bond_id}/repayment-schedule")
async def generate_repayment(bond_id: str, req: RepaymentRequest):
    bond = await get_bond(bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")

    principal = bond.get("amount", 0)
    monthly_rate = (req.interest_rate / 100) / 12
    n = req.term_months

    if monthly_rate == 0:
        monthly_payment = principal / n
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**n) / ((1 + monthly_rate)**n - 1)

    total_repayment = monthly_payment * n
    total_interest = total_repayment - principal

    schedule = []
    balance = principal
    for month in range(1, n + 1):
        interest = balance * monthly_rate
        princ = monthly_payment - interest
        balance = max(balance - princ, 0)
        schedule.append({
            "month": month,
            "payment": round(monthly_payment, 2),
            "principal": round(princ, 2),
            "interest": round(interest, 2),
            "balance": round(balance, 2),
        })

    return {
        "bond_id": bond_id,
        "principal": principal,
        "interest_rate": req.interest_rate,
        "term_months": n,
        "monthly_payment": round(monthly_payment, 2),
        "total_repayment": round(total_repayment, 2),
        "total_interest": round(total_interest, 2),
        "schedule": schedule,
    }
