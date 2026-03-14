import logging
import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.dynamodb import list_bonds, get_bond
from services.featherless import check_compliance
import httpx

logger = logging.getLogger("ruralyield.routes.farmers")
router = APIRouter(prefix="/api/farmers", tags=["farmers"])

_credit_cache: dict = {}

MOCK_CREDIT = {
    "credit_score": 720,
    "grade": "B",
    "risk_factors": ["Limited bond history", "Single crop dependency", "Moderate county yield variance"],
    "positive_factors": ["Strong compliance scores", "County has stable yields", "Reasonable funding requests"],
    "recommendation": "Farmer shows solid fundamentals with room for growth. Diversifying crop types and building longer bond history would improve score.",
    "score_breakdown": {"payment_history": 75, "crop_stability": 72, "bond_performance": 78, "location_risk": 68},
}


@router.post("/{farmer_id}/credit-score")
async def get_credit_score(farmer_id: str):
    if farmer_id in _credit_cache:
        return {"success": True, **_credit_cache[farmer_id]}

    bonds = await list_bonds(limit=100)
    farmer_bonds = [b for b in bonds if (b.get("farmer_name", "").lower().replace(" ", "_") == farmer_id.lower() or farmer_id == "default")]

    total = len(farmer_bonds) or 1
    approved = len([b for b in farmer_bonds if b.get("status") in ("APPROVED", "FUNDED")])
    avg_compliance = sum(b.get("compliance_score", 0) for b in farmer_bonds) / total if farmer_bonds else 70

    # Try Featherless/LLM for scoring
    try:
        prompt = f"Farmer has {total} bonds, {approved} approved, avg compliance {avg_compliance:.0f}/100."
        # Use mock for now since this needs Claude API key
        result = dict(MOCK_CREDIT)
        # Adjust score based on actual data
        base = 650
        base += min(approved * 20, 80)
        base += min(int(avg_compliance * 0.5), 50)
        base += min(total * 10, 40)
        result["credit_score"] = min(base, 850)
        if result["credit_score"] >= 750:
            result["grade"] = "A"
        elif result["credit_score"] >= 700:
            result["grade"] = "B"
        elif result["credit_score"] >= 650:
            result["grade"] = "C"
        else:
            result["grade"] = "D"
    except Exception:
        result = dict(MOCK_CREDIT)

    _credit_cache[farmer_id] = result
    return {"success": True, **result}


@router.get("/{farmer_id}/profile")
async def get_farmer_profile(farmer_id: str):
    bonds = await list_bonds(limit=100)
    farmer_bonds = [b for b in bonds if b.get("farmer_name", "").lower().replace(" ", "_") == farmer_id.lower()]

    if not farmer_bonds:
        # Try matching by partial name
        farmer_bonds = [b for b in bonds if farmer_id.lower() in b.get("farmer_name", "").lower().replace(" ", "_")]

    farmer_name = farmer_bonds[0].get("farmer_name", farmer_id) if farmer_bonds else farmer_id
    county = farmer_bonds[0].get("county", "Unknown") if farmer_bonds else "Unknown"
    crop_type = farmer_bonds[0].get("crop_type", "CORN") if farmer_bonds else "CORN"

    total_raised = sum(b.get("amount_raised", 0) for b in farmer_bonds)
    funded_count = len([b for b in farmer_bonds if b.get("status") == "FUNDED"])
    investor_count = sum(b.get("investor_count", 0) for b in farmer_bonds)
    avg_compliance = sum(b.get("compliance_score", 0) for b in farmer_bonds) / len(farmer_bonds) if farmer_bonds else 0

    # Get credit score
    credit = _credit_cache.get(farmer_id, MOCK_CREDIT)

    return {
        "success": True,
        "farmer_id": farmer_id,
        "farmer_name": farmer_name,
        "county": county,
        "crop_type": crop_type,
        "total_raised": round(total_raised, 2),
        "bonds_count": len(farmer_bonds),
        "bonds_funded": funded_count,
        "investor_count": investor_count,
        "avg_compliance": round(avg_compliance, 1),
        "credit_score": credit,
        "bonds": farmer_bonds,
        "has_funded_bond": funded_count > 0,
    }
