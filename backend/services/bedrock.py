import os
import json
import logging

logger = logging.getLogger("ruralyield.services.bedrock")

MODEL_ID = os.getenv("AWS_BEDROCK_MODEL_ID", "anthropic.claude-sonnet-4-5")

MOCK_RISK = {
    "risk_level": "MEDIUM",
    "risk_score": 45,
    "reasoning": (
        "The bond proposal shows moderate risk. USDA yield data indicates "
        "stable crop production in the region. The requested amount is within "
        "typical ranges for agricultural micro-bonds. Weather variability and "
        "market price fluctuations present standard agricultural risks."
    ),
    "source": "mock",
}


def _get_bedrock_client():
    """Return a boto3 bedrock-runtime client, or None if unavailable."""
    try:
        import boto3

        client = boto3.client(
            "bedrock-runtime",
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
        )
        return client
    except Exception:
        return None


async def score_risk(proposal: dict, usda_data: dict) -> dict:
    """
    Score the risk of a bond proposal using AWS Bedrock (Claude).
    Returns a structured risk assessment dict.
    """
    client = _get_bedrock_client()
    if not client:
        logger.warning("Bedrock client unavailable — returning mock risk")
        return MOCK_RISK

    prompt = (
        "You are a risk assessment specialist for agricultural micro-investment bonds. "
        "Analyze the following bond proposal and USDA crop yield data, then return "
        "ONLY valid JSON with these fields:\n"
        "- risk_level: one of LOW, MEDIUM, HIGH\n"
        "- risk_score: integer 0-100 (0=no risk, 100=maximum risk)\n"
        "- reasoning: string explaining the assessment (under 150 words)\n\n"
        f"Bond Proposal:\n{json.dumps(proposal, indent=2)}\n\n"
        f"USDA Yield Data:\n{json.dumps(usda_data, indent=2)}\n\n"
        "Return ONLY valid JSON. No markdown, no explanation outside the JSON."
    )

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "temperature": 0.2,
        "messages": [
            {"role": "user", "content": prompt},
        ],
    })

    try:
        response = client.invoke_model(
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body,
        )

        response_body = json.loads(response["body"].read())
        content = response_body.get("content", [{}])[0].get("text", "")

        # Strip markdown fences if present
        content = content.strip()
        if content.startswith("```"):
            lines = content.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            content = "\n".join(lines)

        result = json.loads(content)
        result.setdefault("risk_level", "MEDIUM")
        result.setdefault("risk_score", 50)
        result.setdefault("reasoning", "")
        result["source"] = "bedrock"

        logger.info("Risk level: %s, score: %d", result["risk_level"], result["risk_score"])
        return result

    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Bedrock response as JSON: %s", exc)
        return {**MOCK_RISK, "source": "mock_parse_error"}
    except Exception as exc:
        logger.error("Bedrock invocation failed: %s — returning mock", exc)
        return MOCK_RISK
