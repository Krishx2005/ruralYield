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
        "bond_id": "seed-001",
        "farmer_name": "John Miller",
        "title": "Sustainable Corn Innovation",
        "amount": 15000,
        "funding_goal": 15000,
        "amount_raised": 15000,
        "investor_count": 8,
        "crop_type": "Corn",
        "county": "Franklin",
        "state": "Ohio",
        "description": "Implementing drought-resistant corn varieties using precision irrigation technology to increase yield by 30% while reducing water usage.",
        "status": "FUNDED",
        "risk_score": 42,
        "risk_level": "MEDIUM",
        "compliance_score": 85,
        "created_at": "2026-01-15T10:00:00",
    },
    {
        "bond_id": "seed-002",
        "farmer_name": "Sarah Chen",
        "title": "Soybean Rotation Program",
        "amount": 8000,
        "funding_goal": 8000,
        "amount_raised": 3200,
        "investor_count": 4,
        "crop_type": "Soybeans",
        "county": "Delaware",
        "state": "Ohio",
        "description": "Three-year crop rotation program to improve soil health and increase soybean yields using regenerative farming practices.",
        "status": "APPROVED",
        "risk_score": 28,
        "risk_level": "LOW",
        "compliance_score": 91,
        "created_at": "2026-02-01T10:00:00",
    },
    {
        "bond_id": "seed-003",
        "farmer_name": "Marcus Johnson",
        "title": "Pickaway Wheat Expansion",
        "amount": 25000,
        "funding_goal": 25000,
        "amount_raised": 8750,
        "investor_count": 5,
        "crop_type": "Wheat",
        "county": "Pickaway",
        "state": "Ohio",
        "description": "Expanding winter wheat production with new cold-hardy varieties and automated harvesting equipment to serve local grain markets.",
        "status": "APPROVED",
        "risk_score": 55,
        "risk_level": "MEDIUM",
        "compliance_score": 78,
        "created_at": "2026-02-20T10:00:00",
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
