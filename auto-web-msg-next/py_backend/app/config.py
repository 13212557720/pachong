from __future__ import annotations

import os
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[2]


def load_env() -> None:
    for path in [APP_ROOT / ".env.local", APP_ROOT / ".env"]:
        if not path.exists():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


load_env()


def env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def database_url() -> str:
    explicit = env("DATABASE_URL")
    if explicit:
        return explicit
    host = env("DB_HOST", "127.0.0.1")
    port = env("DB_PORT", "5432")
    name = env("DB_NAME", "shop_demo")
    user = env("DB_USER", "postgres")
    password = env("DB_PASSWORD", "")
    sslmode = env("DB_SSLMODE", "disable")
    return f"postgres://{user}:{password}@{host}:{port}/{name}?sslmode={sslmode}"


def jwt_secret() -> str:
    return env("JWT_SECRET", "your-secret-key-change-in-production")


def server_host() -> str:
    return env("SERVER_HOST", "0.0.0.0")


def server_port() -> int:
    return int(env("SERVER_PORT", "8000"))
