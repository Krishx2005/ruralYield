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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ruralyield")


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


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ruralyield-finops",
        "version": "1.0.0",
    }
