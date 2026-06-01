"""
File storage service for EPIC CRM.
Uses S3/R2 when configured, falls back to local filesystem storage.
"""
import os
import uuid
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger("epic.storage")

# S3-compatible storage config
S3_BUCKET = os.getenv("S3_BUCKET", "")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "")  # For R2, MinIO, etc.

# Local fallback directory
LOCAL_STORAGE_DIR = os.getenv("FILE_STORAGE_DIR", "/data/uploads")


def _is_s3_configured() -> bool:
    return bool(S3_BUCKET and S3_ACCESS_KEY and S3_SECRET_KEY)


def _ensure_local_dir(subdir: str = "") -> str:
    """Ensure local storage directory exists and return full path."""
    path = os.path.join(LOCAL_STORAGE_DIR, subdir) if subdir else LOCAL_STORAGE_DIR
    os.makedirs(path, exist_ok=True)
    return path


def _generate_key(category: str, filename: str) -> str:
    """Generate a unique storage key for a file."""
    ext = os.path.splitext(filename)[1] if filename else ""
    unique_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d")
    return f"{category}/{timestamp}/{unique_id}{ext}"


async def upload_file(
    content: bytes,
    filename: str,
    category: str = "documents",
    content_type: str = "application/octet-stream",
) -> Dict[str, Any]:
    """
    Upload a file. Uses S3 if configured, otherwise local filesystem.
    Returns {"success": bool, "key": str, "url": str, "provider": str}
    """
    key = _generate_key(category, filename)

    if _is_s3_configured():
        try:
            import httpx
            from hashlib import sha256
            import hmac
            from datetime import timezone

            # Use boto3 if available, otherwise fall back to httpx
            try:
                import boto3
                s3_kwargs = {
                    "service_name": "s3",
                    "region_name": S3_REGION,
                    "aws_access_key_id": S3_ACCESS_KEY,
                    "aws_secret_access_key": S3_SECRET_KEY,
                }
                if S3_ENDPOINT:
                    s3_kwargs["endpoint_url"] = S3_ENDPOINT

                s3 = boto3.client(**s3_kwargs)
                s3.put_object(
                    Bucket=S3_BUCKET,
                    Key=key,
                    Body=content,
                    ContentType=content_type,
                )

                if S3_ENDPOINT:
                    url = f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"
                else:
                    url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"

                logger.info(f"[S3-UPLOAD] {key} ({len(content)} bytes)")
                return {
                    "success": True,
                    "key": key,
                    "url": url,
                    "provider": "s3",
                    "size": len(content),
                }
            except ImportError:
                logger.warning("boto3 not installed — falling back to local storage")
        except Exception as e:
            logger.error(f"[S3-ERROR] {str(e)} — falling back to local storage")

    # Local filesystem fallback
    try:
        dir_path = _ensure_local_dir(os.path.dirname(key))
        file_path = os.path.join(LOCAL_STORAGE_DIR, key)
        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"[LOCAL-UPLOAD] {key} ({len(content)} bytes)")
        return {
            "success": True,
            "key": key,
            "url": f"/api/files/{key}",
            "provider": "local",
            "size": len(content),
        }
    except Exception as e:
        logger.error(f"[STORAGE-ERROR] {str(e)}")
        return {
            "success": False,
            "key": key,
            "url": "",
            "provider": "error",
            "error": str(e),
        }


async def get_file(key: str) -> Optional[bytes]:
    """Retrieve a file by its storage key."""
    if _is_s3_configured():
        try:
            import boto3
            s3_kwargs = {
                "service_name": "s3",
                "region_name": S3_REGION,
                "aws_access_key_id": S3_ACCESS_KEY,
                "aws_secret_access_key": S3_SECRET_KEY,
            }
            if S3_ENDPOINT:
                s3_kwargs["endpoint_url"] = S3_ENDPOINT

            s3 = boto3.client(**s3_kwargs)
            resp = s3.get_object(Bucket=S3_BUCKET, Key=key)
            return resp["Body"].read()
        except Exception as e:
            logger.error(f"[S3-GET-ERROR] {key}: {str(e)}")
            return None

    # Local fallback
    file_path = os.path.join(LOCAL_STORAGE_DIR, key)
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            return f.read()
    return None


async def delete_file(key: str) -> bool:
    """Delete a file by its storage key."""
    if _is_s3_configured():
        try:
            import boto3
            s3_kwargs = {
                "service_name": "s3",
                "region_name": S3_REGION,
                "aws_access_key_id": S3_ACCESS_KEY,
                "aws_secret_access_key": S3_SECRET_KEY,
            }
            if S3_ENDPOINT:
                s3_kwargs["endpoint_url"] = S3_ENDPOINT

            s3 = boto3.client(**s3_kwargs)
            s3.delete_object(Bucket=S3_BUCKET, Key=key)
            logger.info(f"[S3-DELETE] {key}")
            return True
        except Exception as e:
            logger.error(f"[S3-DELETE-ERROR] {key}: {str(e)}")
            return False

    # Local fallback
    file_path = os.path.join(LOCAL_STORAGE_DIR, key)
    if os.path.exists(file_path):
        os.remove(file_path)
        logger.info(f"[LOCAL-DELETE] {key}")
        return True
    return False


def get_storage_status() -> Dict[str, Any]:
    """Return current storage configuration status."""
    return {
        "provider": "s3" if _is_s3_configured() else "local",
        "s3_configured": _is_s3_configured(),
        "s3_bucket": S3_BUCKET if _is_s3_configured() else None,
        "local_dir": LOCAL_STORAGE_DIR if not _is_s3_configured() else None,
    }
