import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.dynamodb import (
    get_bond,
    list_bonds,
    _mock_ledger,
    _get_dynamodb_table,
    _convert_floats,
    _convert_decimals,
    TABLE_LEDGER,
)

logger = logging.getLogger("ruralyield.routes.investors")
router = APIRouter(prefix="/api/investors", tags=["investors"])

# In-memory investor store
_investors: dict = {}
_watchlists: dict = {}


class InvestorCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(default="")
    county: str = Field(default="")


class WatchlistAdd(BaseModel):
    bond_id: str = Field(..., min_length=1)


@router.post("")
async def create_investor(data: InvestorCreate):
    investor_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "investor_id": investor_id,
        "name": data.name,
        "email": data.email,
        "county": data.county,
        "total_invested": 0,
        "created_at": now,
    }
    _investors[investor_id] = record
    return {"success": True, **record}


@router.get("/{investor_id}")
async def get_investor(investor_id: str):
    investor = _investors.get(investor_id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    return {"success": True, "investor": investor}


@router.get("/{investor_id}/portfolio")
async def get_portfolio(investor_id: str):
    investor = _investors.get(investor_id)
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")

    # Get all ledger entries for this investor
    entries = []
    # Check mock ledger
    for entry in _mock_ledger.values():
        if entry.get("investor_id") == investor_id:
            entries.append(entry)

    # Also check DynamoDB
    table = _get_dynamodb_table(TABLE_LEDGER)
    if table:
        try:
            from boto3.dynamodb.conditions import Attr
            resp = table.scan(FilterExpression=Attr("investor_id").eq(investor_id))
            items = resp.get("Items", [])
            entries.extend([_convert_decimals(i) for i in items])
        except Exception:
            pass

    # Build portfolio with bond details
    portfolio = []
    total_invested = 0
    bond_ids_seen = set()
    for entry in entries:
        bid = entry.get("bond_id")
        if not bid or bid in bond_ids_seen:
            continue
        bond_ids_seen.add(bid)
        bond = await get_bond(bid)
        if bond:
            amount = entry.get("amount", 0)
            total_invested += amount
            portfolio.append({
                "bond_id": bid,
                "bond_title": bond.get("title", "Untitled"),
                "amount_invested": amount,
                "bond_status": bond.get("status", "UNKNOWN"),
                "risk_level": bond.get("risk_level", "MEDIUM"),
                "risk_score": bond.get("risk_score", 0),
                "crop_type": bond.get("crop_type", ""),
                "county": bond.get("county", ""),
                "date_invested": entry.get("created_at", ""),
                "returns_estimate": round(amount * 0.08, 2),  # 8% estimated return
            })

    # Update investor total
    _investors[investor_id]["total_invested"] = total_invested

    return {
        "success": True,
        "investor_id": investor_id,
        "portfolio": portfolio,
        "total_invested": total_invested,
        "active_bonds": len(portfolio),
    }


@router.post("/{investor_id}/watchlist")
async def add_to_watchlist(investor_id: str, data: WatchlistAdd):
    if investor_id not in _watchlists:
        _watchlists[investor_id] = set()
    _watchlists[investor_id].add(data.bond_id)
    return {"success": True, "bond_id": data.bond_id}


@router.delete("/{investor_id}/watchlist/{bond_id}")
async def remove_from_watchlist(investor_id: str, bond_id: str):
    if investor_id in _watchlists:
        _watchlists[investor_id].discard(bond_id)
    return {"success": True, "bond_id": bond_id}


@router.get("/{investor_id}/watchlist")
async def get_watchlist(investor_id: str):
    bond_ids = list(_watchlists.get(investor_id, set()))
    bonds = []
    for bid in bond_ids:
        bond = await get_bond(bid)
        if bond:
            bonds.append(bond)
    return {"success": True, "bonds": bonds, "count": len(bonds)}
