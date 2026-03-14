import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from services.dynamodb import get_bond

logger = logging.getLogger("ruralyield.routes.market")
router = APIRouter(prefix="/api/market", tags=["market"])

_listings: dict = {}

class ListingCreate(BaseModel):
    bond_id: str = Field(...)
    seller_investor_id: str = Field(...)
    asking_price: float = Field(..., gt=0)
    original_investment: float = Field(..., gt=0)

class ListingBuy(BaseModel):
    listing_id: str = Field(...)
    buyer_investor_id: str = Field(...)

@router.get("")
async def get_listings():
    active = [v for v in _listings.values() if v["status"] == "ACTIVE"]
    # Enrich with bond data
    for listing in active:
        bond = await get_bond(listing["bond_id"])
        if bond:
            listing["bond_title"] = bond.get("title", "Unknown")
            listing["farmer_name"] = bond.get("farmer_name", "Unknown")
            listing["crop_type"] = bond.get("crop_type", "")
            listing["risk_level"] = bond.get("risk_level", "MEDIUM")
    return {"success": True, "listings": active, "count": len(active)}

@router.post("/list")
async def create_listing(data: ListingCreate):
    bond = await get_bond(data.bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")

    listing_id = str(uuid.uuid4())
    discount = round(((data.original_investment - data.asking_price) / data.original_investment) * 100, 1) if data.original_investment > 0 else 0

    listing = {
        "listing_id": listing_id,
        "bond_id": data.bond_id,
        "seller_investor_id": data.seller_investor_id,
        "asking_price": data.asking_price,
        "original_investment": data.original_investment,
        "discount_rate": discount,
        "listed_at": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
        "bond_title": bond.get("title", ""),
        "farmer_name": bond.get("farmer_name", ""),
    }
    _listings[listing_id] = listing
    return {"success": True, **listing}

@router.post("/buy")
async def buy_listing(data: ListingBuy):
    listing = _listings.get(data.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["status"] != "ACTIVE":
        raise HTTPException(status_code=400, detail="Listing is no longer active")

    listing["status"] = "SOLD"
    listing["buyer_investor_id"] = data.buyer_investor_id
    listing["sold_at"] = datetime.now(timezone.utc).isoformat()
    return {"success": True, **listing}

@router.delete("/{listing_id}")
async def cancel_listing(listing_id: str):
    listing = _listings.get(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing["status"] = "CANCELLED"
    return {"success": True, "listing_id": listing_id}
