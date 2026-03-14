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


SEED_BONDS = [
    {
        "title": "Spring Corn Innovation Bond",
        "amount": 15000,
        "crop_type": "CORN",
        "county": "Franklin County",
        "description": "Precision agriculture upgrade for 200-acre corn operation. Funds will cover GPS-guided planting equipment and soil sensor network installation.",
        "farmer_name": "James Mitchell",
        "status": "APPROVED",
        "compliance_score": 82,
        "risk_level": "LOW",
        "risk_score": 28,
        "usda_data": {"yield_avg": 181, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "compliance_result": {
            "compliance_score": 82,
            "missing_disclosures": ["Crop insurance details"],
            "jurisdiction_risks": [],
            "suggested_fixes": ["Add crop insurance documentation"],
            "summary": "Bond meets basic regulatory requirements with minor documentation gaps.",
        },
        "risk_result": {
            "risk_level": "LOW",
            "risk_score": 28,
            "reasoning": "Strong county yield history and reasonable funding amount relative to acreage. Franklin County corn yields stable at 181 bu/acre.",
        },
        "decision_reason": "Compliance score 82/100 meets threshold. Risk level LOW is acceptable.",
        "amount_raised": 4500,
        "investor_count": 3,
    },
    {
        "title": "Soybean Drought-Resistant Seed Fund",
        "amount": 22000,
        "crop_type": "SOYBEANS",
        "county": "Delaware County",
        "description": "Transitioning 150 acres to drought-resistant soybean varieties. Includes seed purchase, soil amendments, and first-year monitoring equipment.",
        "farmer_name": "Sarah Chen",
        "status": "APPROVED",
        "compliance_score": 91,
        "risk_level": "LOW",
        "risk_score": 22,
        "usda_data": {"yield_avg": 185, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "compliance_result": {
            "compliance_score": 91,
            "missing_disclosures": [],
            "jurisdiction_risks": [],
            "suggested_fixes": [],
            "summary": "Excellent compliance. All required disclosures present.",
        },
        "risk_result": {
            "risk_level": "LOW",
            "risk_score": 22,
            "reasoning": "Delaware County shows strong upward yield trends. Drought-resistant varieties reduce weather risk significantly.",
        },
        "decision_reason": "Compliance score 91/100 meets threshold. Risk level LOW is acceptable.",
        "amount_raised": 22000,
        "investor_count": 8,
    },
    {
        "title": "Wheat Cover Crop Expansion",
        "amount": 8500,
        "crop_type": "WHEAT",
        "county": "Pickaway County",
        "description": "Expanding winter wheat cover crop program across 300 acres to improve soil health and provide additional revenue stream.",
        "farmer_name": "Robert Alvarez",
        "status": "FUNDED",
        "compliance_score": 76,
        "risk_level": "MEDIUM",
        "risk_score": 45,
        "usda_data": {"yield_avg": 195, "yield_unit": "BU / ACRE", "source": "USDA NASS 2024"},
        "compliance_result": {
            "compliance_score": 76,
            "missing_disclosures": ["Water usage projections", "Prior year financials"],
            "jurisdiction_risks": ["County zoning review pending"],
            "suggested_fixes": ["Include 3-year financial history", "Add water management plan"],
            "summary": "Meets threshold but several documentation improvements recommended.",
        },
        "risk_result": {
            "risk_level": "MEDIUM",
            "risk_score": 45,
            "reasoning": "Pickaway County yields strong at 195 bu/acre but wheat market pricing introduces moderate volatility risk.",
        },
        "decision_reason": "Compliance score 76/100 meets threshold. Risk level MEDIUM is acceptable.",
        "amount_raised": 8500,
        "investor_count": 5,
    },
]


async def seed_sample_bonds():
    """Insert sample bonds if the bonds table is empty."""
    from services.dynamodb import list_bonds, create_bond

    try:
        existing = await list_bonds(limit=1)
        if existing:
            logger.info("Bonds table already has data — skipping seed")
            return

        logger.info("Bonds table empty — seeding %d sample bonds", len(SEED_BONDS))
        for bond_data in SEED_BONDS:
            result = await create_bond(bond_data)
            logger.info("Seeded bond: %s (id=%s)", bond_data["title"], result["bond_id"])

        logger.info("Seed complete")
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
