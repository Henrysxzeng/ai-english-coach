from __future__ import annotations
import base64
import os
from typing import Optional
import jwt  # PyJWT

_JWKS_CACHE: Optional[dict] = None


def _get_jwks_url() -> str:
    pk = os.environ.get("CLERK_PUBLISHABLE_KEY", "")
    key_part = pk.removeprefix("pk_test_").removeprefix("pk_live_")
    padded = key_part + "=" * (4 - len(key_part) % 4)
    domain = base64.b64decode(padded).decode().rstrip("$")
    return f"https://{domain}/.well-known/jwks.json"


async def get_clerk_user_id(authorization: Optional[str]) -> Optional[str]:
    """从 Authorization: Bearer <token> 中解析并验证 Clerk user ID。"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    try:
        from jwt import PyJWKClient
        client = PyJWKClient(_get_jwks_url(), cache_keys=True)
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload.get("sub")
    except Exception:
        return None


def get_admin_user_ids() -> set[str]:
    raw = os.environ.get("ADMIN_USER_IDS", "")
    return {uid.strip() for uid in raw.split(",") if uid.strip()}


def get_pro_user_ids() -> set[str]:
    raw = os.environ.get("PRO_USER_IDS", "")
    return {uid.strip() for uid in raw.split(",") if uid.strip()}
