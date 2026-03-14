import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter
from services.dynamodb import list_bonds

logger = logging.getLogger("ruralyield.routes.impact")
router = APIRouter(prefix="/api/impact", tags=["impact"])

@router.get("")
async def get_impact():
    bonds = await list_bonds(limit=500)

    if not bonds:
        # Mock impact data
        return {
            "total_acres_funded": 1250,
            "farmers_supported": 18,
            "food_produced_lbs": 12467500,
            "co2_saved_tons": 625,
            "total_capital_deployed": 287500,
            "communities_reached": 8,
            "avg_bond_size": 15972,
            "jobs_supported": 29,
            "impact_by_crop": {
                "CORN": {"acres": 600, "food_lbs": 6048000},
                "SOYBEANS": {"acres": 350, "food_lbs": 1176000},
                "WHEAT": {"acres": 300, "food_lbs": 5243500},
            },
            "impact_by_county": [
                {"county": "Franklin County", "acres": 400, "farmers": 6, "capital": 95000},
                {"county": "Delaware County", "acres": 350, "farmers": 5, "capital": 72000},
                {"county": "Pickaway County", "acres": 300, "farmers": 4, "capital": 55000},
            ],
            "monthly_impact": [
                {"month": (datetime.now(timezone.utc) - timedelta(days=30*i)).strftime("%Y-%m"), "acres_added": 80 + i * 30, "capital_added": 15000 + i * 5000}
                for i in range(5, -1, -1)
            ],
        }

    total_capital = sum(b.get("amount_raised", b.get("amount", 0)) for b in bonds)
    farmers = set(b.get("farmer_name", "") for b in bonds if b.get("farmer_name"))
    counties = set(b.get("county", "") for b in bonds if b.get("county"))

    # Estimate acres: ~$100/acre average cost
    total_acres = round(total_capital / 100)

    # Crop yield estimates (bu/acre * lbs/bushel)
    YIELD_LBS = {"CORN": 180 * 56, "SOYBEANS": 52 * 60, "WHEAT": 75 * 60}

    impact_by_crop = defaultdict(lambda: {"acres": 0, "food_lbs": 0})
    for b in bonds:
        crop = b.get("crop_type", "CORN")
        acres = round(b.get("amount_raised", b.get("amount", 0)) / 100)
        impact_by_crop[crop]["acres"] += acres
        impact_by_crop[crop]["food_lbs"] += acres * YIELD_LBS.get(crop, 5000)

    food_lbs = sum(v["food_lbs"] for v in impact_by_crop.values())

    impact_by_county = []
    county_map = defaultdict(lambda: {"acres": 0, "farmers": set(), "capital": 0})
    for b in bonds:
        c = b.get("county", "Unknown")
        county_map[c]["acres"] += round(b.get("amount_raised", b.get("amount", 0)) / 100)
        county_map[c]["farmers"].add(b.get("farmer_name", ""))
        county_map[c]["capital"] += b.get("amount_raised", 0)
    for c, v in county_map.items():
        impact_by_county.append({"county": c, "acres": v["acres"], "farmers": len(v["farmers"]), "capital": round(v["capital"], 2)})

    now = datetime.now(timezone.utc)
    monthly = [{"month": (now - timedelta(days=30*i)).strftime("%Y-%m"), "acres_added": max(total_acres // 6, 10), "capital_added": max(round(total_capital / 6), 1000)} for i in range(5, -1, -1)]

    return {
        "total_acres_funded": total_acres,
        "farmers_supported": len(farmers),
        "food_produced_lbs": food_lbs,
        "co2_saved_tons": round(total_acres * 0.5),
        "total_capital_deployed": round(total_capital, 2),
        "communities_reached": len(counties),
        "avg_bond_size": round(total_capital / len(bonds)) if bonds else 0,
        "jobs_supported": max(round(total_capital / 10000), 1),
        "impact_by_crop": dict(impact_by_crop),
        "impact_by_county": impact_by_county,
        "monthly_impact": monthly,
    }
