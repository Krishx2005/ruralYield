import json
import uuid
import os
import logging
from datetime import datetime

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LEDGER_TABLE = os.environ.get("DYNAMODB_TABLE_LEDGER", "ruralledger")
BONDS_TABLE = os.environ.get("DYNAMODB_TABLE_BONDS", "ruralbonds")

dynamodb = boto3.resource("dynamodb")
ledger_table = dynamodb.Table(LEDGER_TABLE)
bonds_table = dynamodb.Table(BONDS_TABLE)


def lambda_handler(event, context):
    """Process ledger updates for bond investments."""
    logger.info("Received event: %s", json.dumps(event))

    # Parse body if invoked via API Gateway
    if isinstance(event, str):
        event = json.loads(event)
    if "body" in event:
        body = event["body"]
        if isinstance(body, str):
            body = json.loads(body)
    else:
        body = event

    # Validate required fields
    required_fields = ["bond_id", "investor_id", "amount", "type"]
    missing = [f for f in required_fields if f not in body]
    if missing:
        logger.error("Missing required fields: %s", missing)
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": f"Missing required fields: {', '.join(missing)}"
            }),
        }

    bond_id = body["bond_id"]
    investor_id = body["investor_id"]
    amount = body["amount"]
    txn_type = body["type"]

    # Validate transaction type
    if txn_type not in ("INVEST", "REFUND"):
        logger.error("Invalid transaction type: %s", txn_type)
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "type must be INVEST or REFUND"
            }),
        }

    # Validate amount
    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError("Amount must be positive")
    except (TypeError, ValueError) as exc:
        logger.error("Invalid amount: %s", exc)
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": f"Invalid amount: {exc}"}),
        }

    transaction_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"

    # Write ledger entry
    try:
        ledger_entry = {
            "transaction_id": transaction_id,
            "bond_id": bond_id,
            "investor_id": investor_id,
            "amount": str(amount),
            "type": txn_type,
            "timestamp": timestamp,
            "status": "COMPLETED",
        }
        ledger_table.put_item(Item=ledger_entry)
        logger.info("Ledger entry created: %s", transaction_id)
    except ClientError as exc:
        logger.error("Failed to write ledger entry: %s", exc)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "Failed to create ledger entry",
                "detail": str(exc),
            }),
        }

    # Update bond status to FUNDED if this is an investment
    if txn_type == "INVEST":
        try:
            bonds_table.update_item(
                Key={"bond_id": bond_id},
                UpdateExpression="SET #s = :status, funded_by = :investor, funded_at = :ts, funded_amount = :amt",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":status": "FUNDED",
                    ":investor": investor_id,
                    ":ts": timestamp,
                    ":amt": str(amount),
                },
            )
            logger.info("Bond %s status updated to FUNDED", bond_id)
        except ClientError as exc:
            logger.error("Failed to update bond status: %s", exc)
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({
                    "error": "Ledger entry created but failed to update bond status",
                    "transaction_id": transaction_id,
                    "detail": str(exc),
                }),
            }

    response_body = {
        "message": "Transaction processed successfully",
        "transaction_id": transaction_id,
        "bond_id": bond_id,
        "investor_id": investor_id,
        "amount": amount,
        "type": txn_type,
        "timestamp": timestamp,
        "status": "COMPLETED",
    }

    logger.info("Transaction completed: %s", json.dumps(response_body))

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(response_body),
    }
