import os
import json
import logging

import httpx

logger = logging.getLogger("ruralyield.services.featherless")

FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "")
FEATHERLESS_URL = "https://api.featherless.ai/v1/chat/completions"
MODEL = "meta-llama/Llama-3.1-8B-Instruct"

SYSTEM_PROMPT = (
    "You are a financial compliance assistant specializing in rural "
    "micro-investment instruments. Analyze the bond proposal and return "
    "ONLY valid JSON with these fields: missing_disclosures (array of strings), "
    "jurisdiction_risks (array of strings), suggested_fixes (array of strings), "
    "compliance_score (integer 0-100), summary (string under 100 words). "
    "No markdown, no explanation, only JSON."
)

MOCK_COMPLIANCE = {
    "missing_disclosures": [
        "Audited financial statements not provided",
        "Risk factor disclosure incomplete",
    ],
    "jurisdiction_risks": [
        "State-level agricultural bond registration may be required",
    ],
    "suggested_fixes": [
        "Add audited financial statements",
        "Include detailed risk factor section",
        "Verify state registration requirements",
    ],
    "compliance_score": 72,
    "summary": (
        "The bond proposal meets basic requirements but lacks audited "
        "financial statements and complete risk disclosures. State-level "
        "registration should be verified. Overall compliance is moderate."
    ),
    "source": "mock",
}


async def check_compliance(proposal_text: str) -> dict:
    """
    Send a bond proposal to Featherless.AI for compliance analysis.
    Returns a structured compliance report dict.
    """
    if not FEATHERLESS_API_KEY:
        logger.warning("FEATHERLESS_API_KEY not set — returning mock compliance")
        return MOCK_COMPLIANCE

    headers = {
        "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": proposal_text},
        ],
        "temperature": 0.2,
        "max_tokens": 1024,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(FEATHERLESS_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]

        # Strip markdown code fences if present
        content = content.strip()
        if content.startswith("```"):
            lines = content.split("\n")
            # Remove first and last lines (fences)
            lines = [l for l in lines if not l.strip().startswith("```")]
            content = "\n".join(lines)

        result = json.loads(content)

        # Ensure required fields exist
        result.setdefault("missing_disclosures", [])
        result.setdefault("jurisdiction_risks", [])
        result.setdefault("suggested_fixes", [])
        result.setdefault("compliance_score", 50)
        result.setdefault("summary", "")
        result["source"] = "featherless"

        logger.info("Compliance score: %d", result["compliance_score"])
        return result

    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Featherless response as JSON: %s", exc)
        return {**MOCK_COMPLIANCE, "source": "mock_parse_error"}
    except Exception as exc:
        logger.error("Featherless API failed: %s — returning mock", exc)
        return MOCK_COMPLIANCE
