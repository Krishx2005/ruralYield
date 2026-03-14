"""
Jaseci Agent Tool Functions

These are wrapper functions that the Jaseci bond_agent walker calls
at each node in the pipeline. They bridge the Jaseci graph traversal
to the actual backend service implementations.
"""

import asyncio
import logging

from services.featherless import check_compliance
from services.bedrock import score_risk
from services.dynamodb import create_bond, update_bond_status
from services.lambda_trigger import trigger_ledger_update
from services.elevenlabs import text_to_speech
from agent import fetch_usda_yield

logger = logging.getLogger("ruralyield.jaseci.tools")


def _run_async(coro):
    """Run an async coroutine from synchronous Jaseci tool context."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, coro).result()
    else:
        return asyncio.run(coro)


def run_compliance_check(proposal: dict) -> dict:
    """Run Featherless.AI compliance check on a bond proposal."""
    proposal_text = (
        f"Bond Title: {proposal.get('title', '')}\n"
        f"Amount: ${proposal.get('amount', 0)}\n"
        f"Crop Type: {proposal.get('crop_type', '')}\n"
        f"County: {proposal.get('county', '')}\n"
        f"Description: {proposal.get('description', '')}\n"
    )
    return _run_async(check_compliance(proposal_text))


def fetch_usda_data(crop: str, county: str) -> dict:
    """Fetch USDA crop yield data."""
    return _run_async(fetch_usda_yield(crop, county))


def run_risk_score(proposal: dict, usda_data: dict) -> dict:
    """Run Bedrock risk scoring."""
    return _run_async(score_risk(proposal, usda_data))


def write_bond_to_db(proposal: dict, status: str, reason: str) -> str:
    """Write bond record to DynamoDB. Returns bond_id."""
    bond_data = {
        **proposal,
        "status": status,
        "decision_reason": reason,
    }
    result = _run_async(create_bond(bond_data))
    return result.get("bond_id", "unknown")


def trigger_lambda_ledger(bond_id: str, investor_id: str, amount: float) -> dict:
    """Trigger Lambda to create a ledger entry."""
    return _run_async(
        trigger_ledger_update(
            bond_id=bond_id,
            investor_id=investor_id,
            amount=amount,
            entry_type="BOND_CREATED",
        )
    )


def generate_voice_response(decision: str, title: str) -> bool:
    """Generate a TTS voice response for the decision. Returns True on success."""
    text = (
        f"Your bond proposal titled {title} has been "
        f"{decision.lower().replace('_', ' ')}."
    )
    try:
        audio = _run_async(text_to_speech(text))
        return len(audio) > 0
    except Exception as exc:
        logger.error("Voice generation failed: %s", exc)
        return False


def get_previous_node(node_type: str):
    """
    Placeholder for Jaseci graph node retrieval.
    In a real Jaseci runtime, this would traverse the graph
    to find the most recent node of the given type.
    Returns None in this standalone wrapper context.
    """
    logger.debug("get_previous_node(%s) called — placeholder", node_type)
    return None
