from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import uuid
from dataclasses import dataclass
from typing import Any, Optional


class AuthError(ValueError):
    pass


@dataclass(frozen=True)
class Claims:
    user_id: str
    username: str
    token_type: str


def extract_bearer_token(auth_header: Optional[str]) -> str:
    if not auth_header:
        return ""
    parts = auth_header.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return ""


def generate_access_token(
    *,
    secret: str,
    user_id: str,
    username: str,
    valid_days: int,
) -> str:
    now = int(time.time())
    ttl = max(valid_days, 1) * 24 * 60 * 60
    payload = {
        "sub": user_id,
        "exp": now + ttl,
        "nbf": now,
        "iat": now,
        "jti": str(uuid.uuid4()),
        "user_id": user_id,
        "username": username,
        "token_type": "access",
    }
    return _sign_jwt(payload, secret)


def validate_access_token(token: str, secret: str) -> Claims:
    payload = _verify_jwt(token, secret)
    now = int(time.time())
    if int(payload.get("nbf", 0)) > now:
        raise AuthError("令牌尚未生效")
    if int(payload.get("exp", 0)) < now:
        raise AuthError("令牌已过期")
    if payload.get("token_type") != "access":
        raise AuthError("无效的令牌类型")
    user_id = str(payload.get("user_id") or payload.get("sub") or "")
    username = str(payload.get("username") or "")
    if not user_id:
        raise AuthError("令牌缺少用户ID")
    return Claims(user_id=user_id, username=username, token_type="access")


def _sign_jwt(payload: dict[str, Any], secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_part = _b64_json(header)
    payload_part = _b64_json(payload)
    signing_input = f"{header_part}.{payload_part}".encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_part}.{payload_part}.{_b64_encode(signature)}"


def _verify_jwt(token: str, secret: str) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 3:
        raise AuthError("令牌格式无效")
    header_part, payload_part, signature_part = parts
    header = json.loads(_b64_decode(header_part))
    if header.get("alg") != "HS256":
        raise AuthError("不支持的签名算法")
    signing_input = f"{header_part}.{payload_part}".encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    actual = _b64_decode_bytes(signature_part)
    if not hmac.compare_digest(expected, actual):
        raise AuthError("令牌签名无效")
    payload = json.loads(_b64_decode(payload_part))
    if not isinstance(payload, dict):
        raise AuthError("令牌载荷无效")
    return payload


def _b64_json(value: dict[str, Any]) -> str:
    return _b64_encode(json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


def _b64_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64_decode(value: str) -> str:
    return _b64_decode_bytes(value).decode("utf-8")


def _b64_decode_bytes(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)
