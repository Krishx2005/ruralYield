import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional

logger = logging.getLogger("ruralyield.services.dynamodb")

TABLE_BONDS = os.getenv("DYNAMODB_TABLE_BONDS", "ruralyield-bonds")
TABLE_LEDGER = os.getenv("DYNAMODB_TABLE_LEDGER", "ruralyield-ledger")

# In-memory store used when DynamoDB is not available
_mock_bonds: dict[str, dict] = {}
_mock_ledger: dict[str, dict] = {}


def _get_dynamodb_table(table_name: str):
    """Return a DynamoDB table resource, or None if unavailable."""
    try:
        import boto3

        dynamodb = boto3.resource(
            "dynamodb",
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
        )
        table = dynamodb.Table(table_name)
        # Quick check — will raise if table doesn't exist
        table.table_status  # noqa: B018
        return table
    except Exception:
        return None


def _convert_floats(obj):
    """Recursively convert floats to Decimal for DynamoDB compatibility."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _convert_floats(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_floats(i) for i in obj]
    return obj


def _convert_decimals(obj):
    """Recursively convert Decimals back to floats for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _convert_decimals(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_decimals(i) for i in obj]
    return obj


# --------------------------------------------------------------------------
# Bonds
# --------------------------------------------------------------------------

async def create_bond(bond_data: dict) -> dict:
    """Create a new bond record. Returns dict with bond_id."""
    bond_id = bond_data.get("bond_id") or str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    record = {
        "bond_id": bond_id,
        "created_at": now,
        "updated_at": now,
        "total_invested": 0,
        "funding_goal": bond_data.get("amount", 0),
        "amount_raised": 0,
        "investor_count": 0,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        **bond_data,
    }

    table = _get_dynamodb_table(TABLE_BONDS)
    if table:
        try:
            table.put_item(Item=_convert_floats(record))
            logger.info("Bond %s written to DynamoDB", bond_id)
        except Exception as exc:
            logger.error("DynamoDB put_item failed: %s — using mock", exc)
            _mock_bonds[bond_id] = record
    else:
        logger.info("DynamoDB unavailable — storing bond %s in memory", bond_id)
        _mock_bonds[bond_id] = record

    return {"bond_id": bond_id, "created_at": now}


async def get_bond(bond_id: str) -> Optional[dict]:
    """Retrieve a bond by ID."""
    table = _get_dynamodb_table(TABLE_BONDS)
    if table:
        try:
            resp = table.get_item(Key={"bond_id": bond_id})
            item = resp.get("Item")
            return _convert_decimals(item) if item else None
        except Exception as exc:
            logger.error("DynamoDB get_item failed: %s — checking mock", exc)

    return _mock_bonds.get(bond_id)


async def list_bonds(limit: int = 50, status: Optional[str] = None) -> list[dict]:
    """List bonds, optionally filtered by status."""
    table = _get_dynamodb_table(TABLE_BONDS)
    if table:
        try:
            if status:
                from boto3.dynamodb.conditions import Attr

                resp = table.scan(
                    FilterExpression=Attr("status").eq(status),
                    Limit=limit,
                )
            else:
                resp = table.scan(Limit=limit)
            items = resp.get("Items", [])
            return [_convert_decimals(i) for i in items]
        except Exception as exc:
            logger.error("DynamoDB scan failed: %s — using mock", exc)

    bonds = list(_mock_bonds.values())
    if status:
        bonds = [b for b in bonds if b.get("status") == status]
    return bonds[:limit]


async def update_bond_status(
    bond_id: str, status: str, extra: Optional[dict] = None
) -> dict:
    """Update a bond's status and optional extra fields."""
    now = datetime.now(timezone.utc).isoformat()

    table = _get_dynamodb_table(TABLE_BONDS)
    if table:
        try:
            update_expr = "SET #s = :s, updated_at = :u"
            expr_values: dict = {
                ":s": status,
                ":u": now,
            }
            expr_names = {"#s": "status"}

            if extra:
                for idx, (k, v) in enumerate(extra.items()):
                    alias = f":e{idx}"
                    update_expr += f", {k} = {alias}"
                    expr_values[alias] = _convert_floats(v)

            table.update_item(
                Key={"bond_id": bond_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=_convert_floats(expr_values),
                ExpressionAttributeNames=expr_names,
            )
            logger.info("Bond %s status updated to %s", bond_id, status)
            return {"bond_id": bond_id, "status": status, "updated_at": now}
        except Exception as exc:
            logger.error("DynamoDB update failed: %s — updating mock", exc)

    if bond_id in _mock_bonds:
        _mock_bonds[bond_id]["status"] = status
        _mock_bonds[bond_id]["updated_at"] = now
        if extra:
            _mock_bonds[bond_id].update(extra)

    return {"bond_id": bond_id, "status": status, "updated_at": now}


# --------------------------------------------------------------------------
# Ledger
# --------------------------------------------------------------------------

async def create_ledger_entry(entry_data: dict) -> dict:
    """Create a new ledger entry."""
    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    record = {
        "entry_id": entry_id,
        "created_at": now,
        **entry_data,
    }

    table = _get_dynamodb_table(TABLE_LEDGER)
    if table:
        try:
            table.put_item(Item=_convert_floats(record))
            logger.info("Ledger entry %s written to DynamoDB", entry_id)
        except Exception as exc:
            logger.error("DynamoDB ledger put failed: %s — using mock", exc)
            _mock_ledger[entry_id] = record
    else:
        logger.info("DynamoDB unavailable — storing ledger %s in memory", entry_id)
        _mock_ledger[entry_id] = record

    return {"entry_id": entry_id, "created_at": now}


async def get_ledger_for_bond(bond_id: str) -> list[dict]:
    """Get all ledger entries for a given bond."""
    table = _get_dynamodb_table(TABLE_LEDGER)
    if table:
        try:
            from boto3.dynamodb.conditions import Attr

            resp = table.scan(FilterExpression=Attr("bond_id").eq(bond_id))
            items = resp.get("Items", [])
            return [_convert_decimals(i) for i in items]
        except Exception as exc:
            logger.error("DynamoDB ledger scan failed: %s — using mock", exc)

    return [v for v in _mock_ledger.values() if v.get("bond_id") == bond_id]
