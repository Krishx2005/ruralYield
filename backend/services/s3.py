import os
import logging
import uuid

logger = logging.getLogger("ruralyield.services.s3")

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "ruralyield-assets")

# In-memory store when S3 is unavailable
_mock_store: dict[str, bytes] = {}


def _get_s3_client():
    """Return a boto3 S3 client, or None if unavailable."""
    try:
        import boto3

        client = boto3.client(
            "s3",
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
        )
        return client
    except Exception:
        return None


async def upload_file(file_bytes: bytes, filename: str) -> str:
    """Upload a file to S3 and return its URL."""
    key = f"uploads/{uuid.uuid4()}/{filename}"

    client = _get_s3_client()
    if client:
        try:
            client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=key,
                Body=file_bytes,
            )
            region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
            s3_url = f"https://{S3_BUCKET_NAME}.s3.{region}.amazonaws.com/{key}"
            logger.info("Uploaded %s to S3: %s", filename, s3_url)
            return s3_url
        except Exception as exc:
            logger.error("S3 upload failed: %s — using mock", exc)

    logger.info("S3 unavailable — storing %s in memory", key)
    _mock_store[key] = file_bytes
    return f"mock://s3/{S3_BUCKET_NAME}/{key}"


async def download_file(key: str) -> bytes:
    """Download a file from S3 by key."""
    client = _get_s3_client()
    if client:
        try:
            resp = client.get_object(Bucket=S3_BUCKET_NAME, Key=key)
            data = resp["Body"].read()
            logger.info("Downloaded %s from S3 (%d bytes)", key, len(data))
            return data
        except Exception as exc:
            logger.error("S3 download failed: %s — checking mock", exc)

    if key in _mock_store:
        return _mock_store[key]

    logger.warning("File %s not found in mock store", key)
    return b""
