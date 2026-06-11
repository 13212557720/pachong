from __future__ import annotations

import datetime as dt
import json
import uuid
from typing import Any, Optional

from .config import database_url


class Database:
    def __init__(self) -> None:
        self.pool: Any = None

    async def connect(self) -> None:
        if self.pool is not None:
            return
        import asyncpg

        self.pool = await asyncpg.create_pool(database_url(), min_size=1, max_size=10)

    async def close(self) -> None:
        if self.pool is not None:
            await self.pool.close()
            self.pool = None

    async def fetch(self, sql: str, *args: Any) -> list[dict[str, Any]]:
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql, *args)
        return [row_to_dict(row) for row in rows]

    async def fetchrow(self, sql: str, *args: Any) -> Optional[dict[str, Any]]:
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(sql, *args)
        return row_to_dict(row) if row is not None else None

    async def fetchval(self, sql: str, *args: Any) -> Any:
        await self.connect()
        async with self.pool.acquire() as conn:
            return await conn.fetchval(sql, *args)

    async def execute(self, sql: str, *args: Any) -> str:
        await self.connect()
        async with self.pool.acquire() as conn:
            return await conn.execute(sql, *args)

    async def transaction(self):
        await self.connect()
        conn = await self.pool.acquire()
        tx = conn.transaction()
        await tx.start()
        return conn, tx


db = Database()


def row_to_dict(row: Any) -> dict[str, Any]:
    return {key: json_safe(row[key]) for key in row.keys()}


def json_safe(value: Any) -> Any:
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [json_safe(item) for item in value]
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    try:
        json.dumps(value)
        return value
    except TypeError:
        return str(value)
