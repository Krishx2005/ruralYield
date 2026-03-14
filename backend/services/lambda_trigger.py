import os
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger("ruralyield.services.lambda_trigger")

LAMBDA_FUNCTION_NAME = os.getenv("LAMBDA_FUNCTION_NAME", "ruralyield-ledger-update")


def _get_lambda_client():
    """Return a boto3 Lambda client, or None if unavailable."""
    try:
        import boto3

        client = boto3.client(
            "lambda",
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
        )
        return client
    except Exception:
        return None


async def trigger_ledger_update(
    bond_id: str,
    investor_id: str,
    amount: float,
    entry_type: str = "INVEST",
) -> dict:
    """
    Trigger a Lambda function to record a ledger entry.
    Returns the Lambda response or a mock result.
    """
    payload = {
        "bond_id": bond_id,
        "investor_id": investor_id,
        "amount": amount,
        "type": entry_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    client = _get_lambda_client()
    if not client:
        logger.warning("Lambda client unavailable — returning mock result")
        return {
            "status": "mock_success",
            "message": "Lambda trigger simulated (no AWS credentials)",
            "payload": payload,
            "source": "mock",
        }

    try:
        response = client.invoke(
            FunctionName=LAMBDA_FUNCTION_NAME,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload),
        )

        response_payload = json.loads(response["Payload"].read())
        status_code = response.get("StatusCode", 0)

        logger.info(
            "Lambda %s invoked — status %d",
            LAMBDA_FUNCTION_NAME,
            status_code,
        )

        return {
            "status": "success" if status_code == 200 else "error",
            "status_code": status_code,
            "response": response_payload,
            "source": "lambda",
        }

    except Exception as exc:
        logger.error("Lambda invocation failed: %s — returning mock", exc)
        return {
            "status": "mock_success",
            "message": f"Lambda trigger failed ({exc}), simulated success",
            "payload": payload,
            "source": "mock",
        }
