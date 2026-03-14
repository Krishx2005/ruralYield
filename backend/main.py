import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.bonds import router as bonds_router
from routes.voice import router as voice_router
from routes.compliance import router as compliance_router
from routes.risk import router as risk_router
from routes.investors import router as investors_router
from routes.analytics import router as analytics_router
from routes.activity import router as activity_router
from routes.farmers import router as farmers_router
from routes.impact import router as impact_router
from routes.pricing import router as pricing_router
from routes.market import router as market_router
from routes.assistant import router as assistant_router
from routes.messages import router as messages_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ruralyield")


def _make_agent_steps(title, status, compliance_score, risk_level, risk_score):
    """Generate realistic agent_steps for a seed bond."""
    base = "2026-01-15T10:00:"
    return [
        {"step": "intake", "timestamp": f"{base}01", "status": "complete", "detail": {"status": "received", "title": title}},
        {"step": "usda_yield", "timestamp": f"{base}03", "status": "complete", "detail": {"status": "fetched", "yield_avg": 181, "source": "USDA NASS 2024"}},
        {"step": "compliance", "timestamp": f"{base}06", "status": "complete", "detail": {"status": "checked", "score": compliance_score}},
        {"step": "risk", "timestamp": f"{base}09", "status": "complete", "detail": {"status": "scored", "risk_level": risk_level, "risk_score": risk_score}},
        {"step": "decision", "timestamp": f"{base}10", "status": "complete", "detail": {"status": status}},
        {"step": "dynamodb_write", "timestamp": f"{base}11", "status": "complete", "detail": {"status": "written"}},
        {"step": "lambda_ledger", "timestamp": f"{base}12", "status": "complete", "detail": {"status": "triggered" if status in ("APPROVED", "FUNDED") else "skipped"}},
        {"step": "voice_response", "timestamp": f"{base}13", "status": "complete", "detail": {"status": "generated"}},
    ]


def _make_compliance_report(score, disclosures=None, risks=None, fixes=None, summary=""):
    """Generate a compliance_report dict for a seed bond."""
    return {
        "compliance_score": score,
        "missing_disclosures": disclosures or [],
        "jurisdiction_risks": risks or [],
        "suggested_fixes": fixes or [],
        "summary": summary,
    }


SEED_BONDS = [
    {
        "bond_id": "seed-001",
        "farmer_name": "John Miller",
        "title": "Drought-Resistant Corn Innovation",
        "amount": 15000,
        "funding_goal": 15000,
        "amount_raised": 15000,
        "investor_count": 8,
        "crop_type": "Corn",
        "county": "Franklin",
        "state": "Ohio",
        "description": "Implementing drought-resistant corn varieties using precision irrigation technology to increase yield by 30% while reducing water usage by 40%. This innovation uses soil moisture sensors and AI-driven irrigation scheduling.",
        "status": "FUNDED",
        "risk_score": 42,
        "risk_level": "MEDIUM",
        "compliance_score": 85,
        "interest_rate": 8.5,
        "farmer_email": "john.miller@farm.com",
        "created_at": "2026-01-15T10:00:00",
        "decision_reason": "Compliance score 85/100 meets threshold. Risk level MEDIUM is acceptable.",
        "usda_data": {"yield_avg": 174, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "risk_result": {"risk_level": "MEDIUM", "risk_score": 42, "reasoning": "Franklin County corn yields stable at 174 bu/acre. Moderate risk from irrigation technology adoption costs, offset by strong water savings potential."},
        "compliance_result": _make_compliance_report(85, ["Crop insurance details"], [], ["Add crop insurance documentation"], "Bond meets regulatory requirements with minor documentation gap."),
        "agent_steps": _make_agent_steps("Drought-Resistant Corn Innovation", "FUNDED", 85, "MEDIUM", 42),
    },
    {
        "bond_id": "seed-002",
        "farmer_name": "Sarah Chen",
        "title": "Regenerative Soybean Rotation",
        "amount": 8000,
        "funding_goal": 8000,
        "amount_raised": 3200,
        "investor_count": 4,
        "crop_type": "Soybeans",
        "county": "Delaware",
        "state": "Ohio",
        "description": "Three-year crop rotation program to improve soil health and increase soybean yields using regenerative farming practices including cover crops, reduced tillage, and natural compost systems.",
        "status": "APPROVED",
        "risk_score": 28,
        "risk_level": "LOW",
        "compliance_score": 91,
        "interest_rate": 7.0,
        "farmer_email": "sarah.chen@farm.com",
        "created_at": "2026-02-01T10:00:00",
        "decision_reason": "Compliance score 91/100 meets threshold. Risk level LOW is acceptable.",
        "usda_data": {"yield_avg": 185, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "risk_result": {"risk_level": "LOW", "risk_score": 28, "reasoning": "Delaware County shows strong upward yield trends. Regenerative practices reduce long-term soil depletion risk and improve yield resilience."},
        "compliance_result": _make_compliance_report(91, [], [], [], "Excellent compliance. All required disclosures present."),
        "agent_steps": _make_agent_steps("Regenerative Soybean Rotation", "APPROVED", 91, "LOW", 28),
    },
    {
        "bond_id": "seed-003",
        "farmer_name": "Marcus Johnson",
        "title": "Pickaway Winter Wheat Expansion",
        "amount": 25000,
        "funding_goal": 25000,
        "amount_raised": 8750,
        "investor_count": 5,
        "crop_type": "Wheat",
        "county": "Pickaway",
        "state": "Ohio",
        "description": "Expanding winter wheat production with new cold-hardy varieties and automated harvesting equipment to serve local grain markets and reduce post-harvest losses by 25%.",
        "status": "APPROVED",
        "risk_score": 55,
        "risk_level": "MEDIUM",
        "compliance_score": 78,
        "interest_rate": 9.5,
        "farmer_email": "marcus.j@farm.com",
        "created_at": "2026-02-20T10:00:00",
        "decision_reason": "Compliance score 78/100 meets threshold. Risk level MEDIUM is acceptable.",
        "usda_data": {"yield_avg": 195, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "risk_result": {"risk_level": "MEDIUM", "risk_score": 55, "reasoning": "Pickaway County yields strong at 195 bu/acre but wheat market pricing introduces moderate volatility risk. Automated harvesting reduces labor dependency."},
        "compliance_result": _make_compliance_report(78, ["Water usage projections", "Prior year financials"], ["County zoning review pending"], ["Include 3-year financial history", "Add water management plan"], "Meets threshold but documentation improvements recommended."),
        "agent_steps": _make_agent_steps("Pickaway Winter Wheat Expansion", "APPROVED", 78, "MEDIUM", 55),
    },
    {
        "bond_id": "seed-004",
        "farmer_name": "Emily Rodriguez",
        "title": "Organic Vegetable CSA Expansion",
        "amount": 12000,
        "funding_goal": 12000,
        "amount_raised": 12000,
        "investor_count": 15,
        "crop_type": "Vegetables",
        "county": "Union",
        "state": "Ohio",
        "description": "Expanding our community-supported agriculture program from 50 to 150 households. Funds will go toward greenhouse infrastructure, refrigerated delivery van, and new raised bed systems for year-round production.",
        "status": "FUNDED",
        "risk_score": 22,
        "risk_level": "LOW",
        "compliance_score": 94,
        "interest_rate": 6.5,
        "farmer_email": "emily.r@organicfarm.com",
        "created_at": "2026-01-05T10:00:00",
        "decision_reason": "Compliance score 94/100 meets threshold. Risk level LOW is acceptable.",
        "usda_data": {"yield_avg": 191, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "risk_result": {"risk_level": "LOW", "risk_score": 22, "reasoning": "Strong CSA demand in Union County with 200+ household waitlist. Greenhouse infrastructure reduces weather risk. Diversified vegetable production provides multiple revenue streams."},
        "compliance_result": _make_compliance_report(94, [], [], [], "Excellent compliance. Comprehensive documentation provided including organic certification and CSA contracts."),
        "agent_steps": _make_agent_steps("Organic Vegetable CSA Expansion", "FUNDED", 94, "LOW", 22),
    },
    {
        "bond_id": "seed-005",
        "farmer_name": "David Okafor",
        "title": "Mercer County Corn Belt Modernization",
        "amount": 35000,
        "funding_goal": 35000,
        "amount_raised": 14000,
        "investor_count": 9,
        "crop_type": "Corn",
        "county": "Mercer",
        "state": "Ohio",
        "description": "Modernizing 200 acres of corn production with GPS-guided planting equipment, variable rate fertilizer application, and drone-based crop monitoring to improve efficiency and reduce input costs by 20%.",
        "status": "APPROVED",
        "risk_score": 48,
        "risk_level": "MEDIUM",
        "compliance_score": 82,
        "interest_rate": 9.0,
        "farmer_email": "david.o@farm.com",
        "created_at": "2026-03-01T10:00:00",
        "decision_reason": "Compliance score 82/100 meets threshold. Risk level MEDIUM is acceptable.",
        "usda_data": {"yield_avg": 201, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "risk_result": {"risk_level": "MEDIUM", "risk_score": 48, "reasoning": "Mercer County has excellent yield at 201 bu/acre with upward trend. Higher bond amount introduces funding concentration risk, mitigated by proven precision ag ROI in similar operations."},
        "compliance_result": _make_compliance_report(82, ["Equipment warranty documentation"], [], ["Add equipment vendor service agreements"], "Solid compliance with minor equipment documentation gap."),
        "agent_steps": _make_agent_steps("Mercer County Corn Belt Modernization", "APPROVED", 82, "MEDIUM", 48),
    },
    {
        "bond_id": "seed-006",
        "farmer_name": "Lisa Thompson",
        "title": "Wayne County Dairy Pasture Revival",
        "amount": 18000,
        "funding_goal": 18000,
        "amount_raised": 18000,
        "investor_count": 11,
        "crop_type": "Livestock",
        "county": "Wayne",
        "state": "Ohio",
        "description": "Restoring 80 acres of degraded pasture land using rotational grazing systems, native grass seeding, and water management infrastructure to support 40 additional dairy cattle and improve milk production quality.",
        "status": "FUNDED",
        "risk_score": 35,
        "risk_level": "LOW",
        "compliance_score": 88,
        "interest_rate": 7.5,
        "farmer_email": "lisa.t@dairyfarm.com",
        "created_at": "2026-01-28T10:00:00",
        "decision_reason": "Compliance score 88/100 meets threshold. Risk level LOW is acceptable.",
        "usda_data": {"yield_avg": 181, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "risk_result": {"risk_level": "LOW", "risk_score": 35, "reasoning": "Wayne County is Ohio's top dairy county. Rotational grazing has proven ROI in similar operations. Stable milk prices and local dairy cooperative membership reduce market risk."},
        "compliance_result": _make_compliance_report(88, ["Veterinary health plan"], [], ["Add herd health certification"], "Strong compliance. Livestock welfare documentation is thorough."),
        "agent_steps": _make_agent_steps("Wayne County Dairy Pasture Revival", "FUNDED", 88, "LOW", 35),
    },
    {
        "bond_id": "seed-007",
        "farmer_name": "Robert Kim",
        "title": "Knox County Apple Orchard Tech",
        "amount": 22000,
        "funding_goal": 22000,
        "amount_raised": 5500,
        "investor_count": 3,
        "crop_type": "Vegetables",
        "county": "Knox",
        "state": "Ohio",
        "description": "Installing automated frost protection systems, precision nutrient delivery, and harvest assist robots across 15 acres of apple orchard to reduce labor costs and frost damage losses by an estimated 45%.",
        "status": "APPROVED",
        "risk_score": 61,
        "risk_level": "MEDIUM",
        "compliance_score": 76,
        "interest_rate": 10.0,
        "farmer_email": "robert.k@orchardtech.com",
        "created_at": "2026-03-05T10:00:00",
        "decision_reason": "Compliance score 76/100 meets threshold. Risk level MEDIUM is acceptable.",
        "usda_data": {"yield_avg": 178, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "risk_result": {"risk_level": "MEDIUM", "risk_score": 61, "reasoning": "Orchard automation technology is relatively new with limited track record in Ohio. Higher risk offset by significant labor cost reduction potential and growing local demand for apples."},
        "compliance_result": _make_compliance_report(76, ["Pesticide usage records", "Labor compliance documentation"], ["State agricultural automation permits pending"], ["Submit pesticide application logs", "Obtain automation operating permits"], "Meets threshold but several documentation items needed."),
        "agent_steps": _make_agent_steps("Knox County Apple Orchard Tech", "APPROVED", 76, "MEDIUM", 61),
    },
    {
        "bond_id": "seed-008",
        "farmer_name": "Anna Kowalski",
        "title": "Darke County Soybean Precision Program",
        "amount": 9500,
        "funding_goal": 9500,
        "amount_raised": 9500,
        "investor_count": 6,
        "crop_type": "Soybeans",
        "county": "Darke",
        "state": "Ohio",
        "description": "Implementing precision agriculture techniques including variable rate seeding, soil sampling grid analysis, and yield mapping across 120 acres to optimize soybean production and reduce input waste.",
        "status": "FUNDED",
        "risk_score": 31,
        "risk_level": "LOW",
        "compliance_score": 90,
        "interest_rate": 7.25,
        "farmer_email": "anna.k@precisionfarm.com",
        "created_at": "2026-02-10T10:00:00",
        "decision_reason": "Compliance score 90/100 meets threshold. Risk level LOW is acceptable.",
        "usda_data": {"yield_avg": 197, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "risk_result": {"risk_level": "LOW", "risk_score": 31, "reasoning": "Darke County has strong stable yields at 197 bu/acre. Precision agriculture techniques have well-documented ROI in Ohio soybean operations. Conservative funding amount reduces concentration risk."},
        "compliance_result": _make_compliance_report(90, [], [], [], "Excellent compliance. Full soil testing results and precision agriculture implementation plan provided."),
        "agent_steps": _make_agent_steps("Darke County Soybean Precision Program", "FUNDED", 90, "LOW", 31),
    },
]


async def seed_sample_bonds():
    """Clear old seed bonds and insert fresh seed data."""
    from services.dynamodb import list_bonds, create_bond, _mock_bonds

    try:
        # Clear existing seed bonds
        existing = await list_bonds(limit=100)
        cleared = 0
        for bond in existing:
            bid = bond.get("bond_id", "")
            if bid.startswith("seed-"):
                _mock_bonds.pop(bid, None)
                cleared += 1
        if cleared:
            logger.info("Cleared %d old seed bonds", cleared)

        # Re-insert all seed bonds
        logger.info("Seeding %d sample bonds", len(SEED_BONDS))
        for bond_data in SEED_BONDS:
            result = await create_bond(bond_data)
            logger.info("Seeded bond: %s (id=%s)", bond_data["title"], result["bond_id"])

        logger.info("Seed complete — %d bonds inserted", len(SEED_BONDS))
    except Exception as exc:
        logger.error("Seed failed: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("RuralYield FinOps backend starting up")
    logger.info(
        "AWS Region: %s", os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    )
    logger.info(
        "DynamoDB bonds table: %s",
        os.getenv("DYNAMODB_TABLE_BONDS", "ruralyield-bonds"),
    )
    await seed_sample_bonds()
    yield
    logger.info("RuralYield FinOps backend shutting down")


app = FastAPI(
    title="RuralYield FinOps",
    description="Micro-investment platform for rural agricultural bonds",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bonds_router)
app.include_router(voice_router)
app.include_router(compliance_router)
app.include_router(risk_router)
app.include_router(investors_router)
app.include_router(analytics_router)
app.include_router(activity_router)
app.include_router(farmers_router)
app.include_router(impact_router)
app.include_router(pricing_router)
app.include_router(market_router)
app.include_router(assistant_router)
app.include_router(messages_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ruralyield-finops",
        "version": "1.0.0",
    }
