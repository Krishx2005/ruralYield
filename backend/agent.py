import os
import logging
import httpx
from datetime import datetime, timezone

from services.dynamodb import create_bond, update_bond_status
from services.featherless import check_compliance
from services.bedrock import score_risk
from services.lambda_trigger import trigger_ledger_update
from services.elevenlabs import text_to_speech
from services.notifications import notify_bond_approved

logger = logging.getLogger("ruralyield.agent")

USDA_API_KEY = os.getenv("USDA_API_KEY", "DEMO_KEY")

MOCK_USDA_DATA = {
    "yield_avg": 175.2,
    "yield_unit": "BU / ACRE",
    "source": "mock",
}


async def fetch_usda_yield(crop: str, county: str) -> dict:
    """Fetch crop yield data from USDA QuickStats API."""
    url = (
        "https://quickstats.nass.usda.gov/api/api_GET/"
        f"?key={USDA_API_KEY}"
        f"&commodity_desc={crop}"
        "&state_alpha=OH"
        f"&county_name={county}"
        "&year=2023"
        "&statisticcat_desc=YIELD"
        "&format=JSON"
    )
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            rows = data.get("data", [])
            if not rows:
                logger.warning("USDA returned no rows for %s/%s, using mock", crop, county)
                return MOCK_USDA_DATA

            values = []
            unit = rows[0].get("unit_desc", "BU / ACRE")
            for row in rows:
                try:
                    values.append(float(row.get("Value", "0").replace(",", "")))
                except (ValueError, TypeError):
                    continue

            if not values:
                return MOCK_USDA_DATA

            return {
                "yield_avg": round(sum(values) / len(values), 2),
                "yield_unit": unit,
                "source": "usda",
                "records": len(values),
            }
    except Exception as exc:
        logger.error("USDA API failed: %s — using mock data", exc)
        return MOCK_USDA_DATA


async def run_bond_agent(proposal: dict) -> dict:
    """
    Jaseci-style agent decision loop for bond proposals.

    Steps:
      1. Receive proposal
      2. Fetch USDA crop yield data
      3. Compliance check via Featherless.AI
      4. Risk scoring via AWS Bedrock
      5. Decision logic
      6. Write to DynamoDB
      7. If approved, trigger Lambda ledger entry
      8. Generate voice response via ElevenLabs TTS

    Returns full decision with audit trail.
    """
    audit_trail: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()

    def log_step(step: str, detail: dict):
        entry = {"step": step, "timestamp": datetime.now(timezone.utc).isoformat(), "detail": detail}
        audit_trail.append(entry)
        logger.info("Agent step [%s]: %s", step, detail.get("status", ""))

    # ------------------------------------------------------------------
    # Step 1: Intake
    # ------------------------------------------------------------------
    title = proposal.get("title", "Untitled Bond")
    amount = proposal.get("amount", 0)
    crop_type = proposal.get("crop_type", "CORN")
    county = proposal.get("county", "FRANKLIN")
    description = proposal.get("description", "")

    log_step("intake", {
        "status": "received",
        "title": title,
        "amount": amount,
        "crop_type": crop_type,
        "county": county,
    })

    # ------------------------------------------------------------------
    # Step 2: USDA yield data
    # ------------------------------------------------------------------
    usda_data = await fetch_usda_yield(crop_type, county)
    log_step("usda_yield", {"status": "fetched", **usda_data})

    # ------------------------------------------------------------------
    # Step 3: Compliance check (Featherless.AI)
    # ------------------------------------------------------------------
    proposal_text = (
        f"Bond Title: {title}\n"
        f"Amount: ${amount}\n"
        f"Crop Type: {crop_type}\n"
        f"County: {county}\n"
        f"Description: {description}\n"
    )
    compliance_result = await check_compliance(proposal_text)
    compliance_score = compliance_result.get("compliance_score", 0)
    log_step("compliance", {"status": "checked", "score": compliance_score, "result": compliance_result})

    # ------------------------------------------------------------------
    # Step 4: Risk scoring (AWS Bedrock)
    # ------------------------------------------------------------------
    risk_result = await score_risk(proposal, usda_data)
    risk_level = risk_result.get("risk_level", "MEDIUM")
    risk_score = risk_result.get("risk_score", 50)
    log_step("risk", {"status": "scored", "risk_level": risk_level, "risk_score": risk_score, "result": risk_result})

    # ------------------------------------------------------------------
    # Step 5: Decision
    # ------------------------------------------------------------------
    if compliance_score >= 70 and risk_level != "HIGH":
        decision = "APPROVED"
        decision_reason = (
            f"Compliance score {compliance_score}/100 meets threshold. "
            f"Risk level {risk_level} is acceptable."
        )
    elif compliance_score < 70:
        decision = "REQUEST_MORE_INFO"
        decision_reason = (
            f"Compliance score {compliance_score}/100 is below the 70 threshold. "
            "Additional disclosures or documentation required."
        )
    else:
        decision = "REJECTED"
        decision_reason = (
            f"Risk level is {risk_level} (score {risk_score}/100). "
            "Bond presents unacceptable risk to investors."
        )

    log_step("decision", {"status": decision, "reason": decision_reason})

    # ------------------------------------------------------------------
    # Step 6: Write bond to DynamoDB
    # ------------------------------------------------------------------
    bond_record = {
        "title": title,
        "amount": amount,
        "crop_type": crop_type,
        "county": county,
        "description": description,
        "status": decision,
        "compliance_score": compliance_score,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "usda_data": usda_data,
        "compliance_result": compliance_result,
        "risk_result": risk_result,
        "audit_trail": audit_trail,
        "decision_reason": decision_reason,
    }
    db_result = await create_bond(bond_record)
    bond_id = db_result.get("bond_id", "unknown")
    log_step("dynamodb_write", {"status": "written", "bond_id": bond_id})

    if decision == "APPROVED":
        try:
            await notify_bond_approved(bond_record)
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Step 7: If APPROVED, trigger Lambda ledger entry
    # ------------------------------------------------------------------
    ledger_result = None
    if decision == "APPROVED":
        ledger_result = await trigger_ledger_update(
            bond_id=bond_id,
            investor_id="SYSTEM",
            amount=amount,
            entry_type="BOND_CREATED",
        )
        log_step("lambda_ledger", {"status": "triggered", "result": ledger_result})
    else:
        log_step("lambda_ledger", {"status": "skipped", "reason": f"Decision was {decision}"})

    # ------------------------------------------------------------------
    # Step 8: Voice response via ElevenLabs TTS
    # ------------------------------------------------------------------
    voice_text = (
        f"Your bond proposal titled {title} for {crop_type} in {county} county "
        f"has been {decision.lower().replace('_', ' ')}. {decision_reason}"
    )
    try:
        voice_audio = await text_to_speech(voice_text)
        has_voice = len(voice_audio) > 0
    except Exception as exc:
        logger.error("Voice synthesis failed: %s", exc)
        voice_audio = b""
        has_voice = False

    log_step("voice_response", {"status": "generated" if has_voice else "failed"})

    return {
        "bond_id": bond_id,
        "decision": decision,
        "decision_reason": decision_reason,
        "compliance_score": compliance_score,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "usda_data": usda_data,
        "compliance_result": compliance_result,
        "risk_result": risk_result,
        "audit_trail": audit_trail,
        "ledger_result": ledger_result,
        "has_voice_response": has_voice,
        "created_at": now,
    }
