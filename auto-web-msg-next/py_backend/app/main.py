from __future__ import annotations

import math
import re
import uuid
from typing import Any, Optional, Union

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .auth import AuthError, extract_bearer_token, generate_access_token, validate_access_token
from .config import jwt_secret, server_host, server_port
from .db import db


ALLOWED_TABLES = {"instagram_users", "send_message_logs", "opened_urls", "task_events", "tokens"}
API_PREFIX = "/api/v1"

app = FastAPI(title="auto-web-msg Python API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    await db.connect()


@app.on_event("shutdown")
async def shutdown() -> None:
    await db.close()


async def require_api_token(authorization: Optional[str] = Header(default=None)) -> None:
    token = extract_bearer_token(authorization)
    secret = jwt_secret()
    if secret and token == secret:
        return
    if not token:
        raise HTTPException(status_code=401, detail="缺少授权Token")
    try:
        validate_access_token(token, secret)
    except AuthError:
        raise HTTPException(status_code=401, detail="无效的JWT令牌") from None

    is_blacklisted = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM tokens WHERE token_value = $1 AND is_blacklisted = true)",
        token,
    )
    if is_blacklisted:
        raise HTTPException(status_code=401, detail="令牌已被拉黑")


async def require_super_token(authorization: Optional[str] = Header(default=None)) -> None:
    token = extract_bearer_token(authorization)
    if not jwt_secret() or token != jwt_secret():
        raise HTTPException(status_code=403, detail="只有超级密钥(JWT_SECRET)拥有此操作权限")


def clean_body(body: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in body.items() if key != "$schema"}


def normalize_id(body: dict[str, Any]) -> dict[str, Any]:
    next_body = clean_body(body)
    next_body["id"] = str(uuid.uuid4())
    return next_body


def parse_bool(value: Optional[str]) -> Optional[bool]:
    if value is None or value == "":
        return None
    return value.lower() in {"true", "1", "yes"}


def parse_csv(value: Optional[Union[str, list[str]]]) -> Optional[list[str]]:
    if value is None:
        return None
    if isinstance(value, list):
        parts: list[str] = []
        for item in value:
            parts.extend(str(item).split(","))
    else:
        parts = str(value).split(",")
    values = [part.strip() for part in parts if part.strip()]
    return values or None


def parse_bool_csv(value: Optional[Union[str, list[str]]]) -> Optional[list[bool]]:
    values = parse_csv(value)
    if not values:
        return None
    return [item.lower() in {"true", "1", "yes"} for item in values]


def optional_int(value: int) -> Optional[int]:
    return None if value == -1 else value


def quote_ident(name: str) -> str:
    if name not in ALLOWED_TABLES:
        raise HTTPException(status_code=404, detail="表不存在或不在白名单中")
    return quote_identifier(name)


def quote_identifier(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def build_instagram_where(
    *,
    keyword: Optional[str],
    is_completed: Optional[str],
    ip_location: Optional[str],
    ip_location_in: Optional[Union[str, list[str]]],
    ip_location_not_in: Optional[Union[str, list[str]]],
    ip_location_not_include_null: Optional[str],
    repeat_count_min: int,
    repeat_count_max: int,
    followers_count_min: int,
    followers_count_max: int,
    is_private_in: Optional[Union[str, list[str]]],
    created_at_min: Optional[str],
    created_at_max: Optional[str],
) -> tuple[str, list[Any]]:
    args: list[Any] = []
    where: list[str] = []

    def add(value: Any) -> str:
        args.append(value)
        return f"${len(args)}"

    if keyword:
        where.append(
            "concat(id, ' ', coalesce(username, ''), ' ', coalesce(full_name, '')) "
            f"ILIKE '%' || {add(keyword)}::text || '%'"
        )
    completed = parse_bool(is_completed)
    if completed is not None:
        where.append(f"is_completed = {add(completed)}::boolean")
    if ip_location:
        where.append(f"ip_location = {add(ip_location)}::text")
    locations = parse_csv(ip_location_in)
    if locations:
        where.append(f"coalesce(nullif(ip_location, ''), 'null') = ANY({add(locations)}::text[])")
    excluded_locations = parse_csv(ip_location_not_in)
    if excluded_locations:
        where.append(f"coalesce(nullif(ip_location, ''), 'null') != ALL({add(excluded_locations)}::text[])")
    exclude_empty_location = parse_bool(ip_location_not_include_null)
    if exclude_empty_location:
        where.append("(ip_location IS NOT NULL AND ip_location != '')")
    if optional_int(repeat_count_min) is not None:
        where.append(f"repeat_count >= {add(repeat_count_min)}::int")
    if optional_int(repeat_count_max) is not None:
        where.append(f"repeat_count <= {add(repeat_count_max)}::int")
    if optional_int(followers_count_min) is not None:
        where.append(f"(followers_count ~ '^[0-9]+$' AND followers_count::int >= {add(followers_count_min)}::int)")
    if optional_int(followers_count_max) is not None:
        where.append(f"(followers_count ~ '^[0-9]+$' AND followers_count::int <= {add(followers_count_max)}::int)")
    private_values = parse_bool_csv(is_private_in)
    if private_values:
        where.append(f"is_private = ANY({add(private_values)}::boolean[])")
    if created_at_min:
        where.append(f"created_at >= {add(created_at_min)}::timestamptz")
    if created_at_max:
        where.append(f"created_at <= {add(created_at_max)}::timestamptz")

    return (" WHERE " + " AND ".join(where)) if where else "", args


@app.get(f"{API_PREFIX}/instagram_users/getInstagramUser", dependencies=[Depends(require_api_token)])
async def get_instagram_user(id: str = Query("")) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM instagram_users WHERE id = $1 LIMIT 1", id)
    if row is None:
        raise HTTPException(status_code=404, detail="Instagram 用户不存在")
    return row


@app.get(f"{API_PREFIX}/instagram_users/listInstagramUsers", dependencies=[Depends(require_api_token)])
async def list_instagram_users(
    limit: int = 20,
    offset: int = 0,
    keyword: Optional[str] = None,
    is_completed: Optional[str] = None,
    ip_location: Optional[str] = None,
    ip_location_in: Optional[str] = None,
    ip_location_not_in: Optional[str] = None,
    ip_location_not_include_null: Optional[str] = None,
    repeat_count_min: int = -1,
    repeat_count_max: int = -1,
    followers_count_min: int = -1,
    followers_count_max: int = -1,
    is_private_in: Optional[str] = None,
    created_at_min: Optional[str] = None,
    created_at_max: Optional[str] = None,
) -> dict[str, Any]:
    where_sql, args = build_instagram_where(
        keyword=keyword,
        is_completed=is_completed,
        ip_location=ip_location,
        ip_location_in=ip_location_in,
        ip_location_not_in=ip_location_not_in,
        ip_location_not_include_null=ip_location_not_include_null,
        repeat_count_min=repeat_count_min,
        repeat_count_max=repeat_count_max,
        followers_count_min=followers_count_min,
        followers_count_max=followers_count_max,
        is_private_in=is_private_in,
        created_at_min=created_at_min,
        created_at_max=created_at_max,
    )
    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    total = await db.fetchval(f"SELECT count(*)::bigint FROM instagram_users{where_sql}", *args)
    rows = await db.fetch(
        f"""
        SELECT * FROM instagram_users{where_sql}
        ORDER BY repeat_count DESC, id ASC
        LIMIT ${len(args) + 1}::int OFFSET ${len(args) + 2}::int
        """,
        *args,
        limit,
        offset,
    )
    return {"items": rows, "total": total}


@app.post(f"{API_PREFIX}/instagram_users/upsertInstagramUser", dependencies=[Depends(require_api_token)])
async def upsert_instagram_user(body: dict[str, Any] = Body(...)) -> dict[str, Any]:
    data = clean_body(body)
    return await upsert_instagram_user_row(data)


@app.post(f"{API_PREFIX}/instagram_users/bulkUpsertInstagramUsers", dependencies=[Depends(require_api_token)])
async def bulk_upsert_instagram_users(body: dict[str, Any] = Body(...)) -> dict[str, int]:
    items = body.get("items") or []
    inserted = 0
    for item in items:
        if isinstance(item, dict):
            await upsert_instagram_user_row(clean_body(item))
            inserted += 1
    return {"inserted": inserted, "failed": 0}


async def upsert_instagram_user_row(data: dict[str, Any]) -> dict[str, Any]:
    row = await db.fetchrow(
        """
        INSERT INTO instagram_users (
            id, username, full_name, is_private, is_verified,
            followers_count, ip_location, biography, raw_json
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            full_name = EXCLUDED.full_name,
            is_private = EXCLUDED.is_private,
            is_verified = EXCLUDED.is_verified,
            followers_count = EXCLUDED.followers_count,
            ip_location = EXCLUDED.ip_location,
            biography = EXCLUDED.biography,
            raw_json = EXCLUDED.raw_json,
            repeat_count = instagram_users.repeat_count + 1
        RETURNING *
        """,
        data["id"],
        data.get("username"),
        data.get("full_name"),
        data.get("is_private"),
        data.get("is_verified"),
        data.get("followers_count"),
        data.get("ip_location"),
        data.get("biography"),
        data.get("raw_json") or "{}",
    )
    if row is None:
        raise HTTPException(status_code=500, detail="Instagram 用户写入失败")
    return row


@app.post(f"{API_PREFIX}/instagram_users/updateInstagramUserCompletion", status_code=204, dependencies=[Depends(require_api_token)])
async def update_instagram_completion(body: dict[str, Any] = Body(...)) -> Response:
    data = clean_body(body)
    await db.execute(
        "UPDATE instagram_users SET is_completed = $2 WHERE id = $1",
        data["id"],
        bool(data.get("is_completed")),
    )
    return Response(status_code=204)


@app.post(f"{API_PREFIX}/instagram_users/updateInstagramUserExtra", status_code=204, dependencies=[Depends(require_api_token)])
async def update_instagram_extra(body: dict[str, Any] = Body(...)) -> Response:
    data = clean_body(body)
    await db.execute(
        "UPDATE instagram_users SET followers_count = $2, ip_location = $3, biography = $4 WHERE id = $1",
        data["id"],
        data.get("followers_count"),
        data.get("ip_location"),
        data.get("biography"),
    )
    return Response(status_code=204)


@app.get(f"{API_PREFIX}/instagram_users/listDistinctIpLocations", dependencies=[Depends(require_api_token)])
async def list_distinct_ip_locations() -> dict[str, Any]:
    rows = await db.fetch(
        "SELECT DISTINCT ip_location FROM instagram_users WHERE ip_location IS NOT NULL AND ip_location != '' ORDER BY ip_location ASC"
    )
    return {"items": [row["ip_location"] for row in rows]}


@app.post(f"{API_PREFIX}/opened_urls/createOpenedUrl", dependencies=[Depends(require_api_token)])
async def create_opened_url(body: dict[str, Any] = Body(...)) -> dict[str, Any]:
    data = normalize_id(body)
    row = await db.fetchrow(
        """
        INSERT INTO opened_urls (id, port, url, canonical_url, forced, action, automation_action)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        """,
        data["id"],
        data.get("port"),
        data.get("url"),
        data["canonical_url"],
        bool(data.get("forced", False)),
        data["action"],
        data.get("automation_action"),
    )
    if row is None:
        raise HTTPException(status_code=500, detail="打开记录写入失败")
    return row


@app.get(f"{API_PREFIX}/opened_urls/existsOpenedUrl", dependencies=[Depends(require_api_token)])
async def exists_opened_url(canonical_url: str = "", action: str = "") -> dict[str, bool]:
    exists = await db.fetchval(
        "SELECT EXISTS(SELECT 1 FROM opened_urls WHERE canonical_url = $1 AND action = $2)",
        canonical_url,
        action,
    )
    return {"exists": bool(exists)}


@app.post(f"{API_PREFIX}/send_message_logs/createSendMessageLog", dependencies=[Depends(require_api_token)])
async def create_send_message_log(body: dict[str, Any] = Body(...)) -> dict[str, Any]:
    data = normalize_id(body)
    row = await db.fetchrow(
        """
        INSERT INTO send_message_logs (id, port, target_url, target_username, message, status, error_message)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        """,
        data["id"],
        data["port"],
        data["target_url"],
        data.get("target_username"),
        data["message"],
        data["status"],
        data.get("error_message"),
    )
    if row is None:
        raise HTTPException(status_code=500, detail="消息日志写入失败")
    return row


@app.get(f"{API_PREFIX}/send_message_logs/listSendMessageLogs", dependencies=[Depends(require_api_token)])
async def list_send_message_logs(limit: int = 20, offset: int = 0, status: Optional[str] = None) -> dict[str, Any]:
    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    args: list[Any] = []
    where = ""
    if status:
        args.append(status)
        where = " WHERE status = $1"
    total = await db.fetchval(f"SELECT count(*)::bigint FROM send_message_logs{where}", *args)
    rows = await db.fetch(
        f"SELECT * FROM send_message_logs{where} ORDER BY sent_at DESC LIMIT ${len(args)+1}::int OFFSET ${len(args)+2}::int",
        *args,
        limit,
        offset,
    )
    return {"items": rows, "total": total}


@app.post(f"{API_PREFIX}/task_events/createTaskEvent", dependencies=[Depends(require_api_token)])
async def create_task_event(body: dict[str, Any] = Body(...)) -> dict[str, Any]:
    data = normalize_id(body)
    row = await db.fetchrow(
        "INSERT INTO task_events (id, run_id, event_json) VALUES ($1,$2,$3) RETURNING *",
        data["id"],
        data["run_id"],
        data["event_json"],
    )
    if row is None:
        raise HTTPException(status_code=500, detail="任务事件写入失败")
    return row


@app.get(f"{API_PREFIX}/task_events/listTaskEvents", dependencies=[Depends(require_api_token)])
async def list_task_events(run_id: str = "") -> dict[str, Any]:
    rows = await db.fetch(
        "SELECT * FROM task_events WHERE run_id = $1 ORDER BY created_at ASC",
        run_id,
    )
    total = await db.fetchval("SELECT count(*)::bigint FROM task_events WHERE run_id = $1", run_id)
    return {"items": rows, "total": total}


@app.get(f"{API_PREFIX}/pg_meta/getPgStatus", dependencies=[Depends(require_api_token)])
async def get_pg_status() -> dict[str, Any]:
    row = await db.fetchrow(
        """
        SELECT
            version() AS version,
            (SELECT numbackends FROM pg_stat_database WHERE datname = current_database()) AS active_connections,
            current_setting('max_connections')::int AS max_connections,
            current_database() AS database,
            pg_size_pretty(pg_database_size(current_database())) AS database_size
        """
    )
    return row or {"version": "", "active_connections": 0, "max_connections": 0, "database": "", "database_size": "0 bytes"}


@app.get(f"{API_PREFIX}/pg_meta/listPgTables", dependencies=[Depends(require_api_token)])
async def list_pg_tables() -> dict[str, Any]:
    rows = await db.fetch(
        """
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC
        """
    )
    return {"tables": [row["table_name"] for row in rows]}


@app.get(f"{API_PREFIX}/pg_meta/getPgTableColumns", dependencies=[Depends(require_api_token)])
async def get_pg_table_columns(table: str = "") -> dict[str, Any]:
    quote_ident(table)
    rows = await db.fetch(
        """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position ASC
        """,
        table,
    )
    return {"columns": rows}


async def searchable_columns(table: str) -> list[str]:
    rows = await db.fetch(
        """
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position ASC
        """,
        table,
    )
    return [row["column_name"] for row in rows]


async def build_pg_keyword_where(table: str, keyword: Optional[str]) -> tuple[str, list[Any]]:
    if not keyword:
        return "", []
    columns = await searchable_columns(table)
    if not columns:
        return "", []
    conditions = [f"CAST(t.{quote_identifier(column)} AS text) ILIKE $1" for column in columns]
    return "WHERE (" + " OR ".join(conditions) + ")", [f"%{keyword}%"]


@app.get(f"{API_PREFIX}/pg_meta/getPgTableRows", dependencies=[Depends(require_api_token)])
async def get_pg_table_rows(table: str = "", page: int = 1, page_size: int = 20, keyword: Optional[str] = None) -> dict[str, Any]:
    table_name = quote_ident(table)
    page = max(page, 1)
    page_size = page_size if 1 <= page_size <= 500 else 20
    offset = (page - 1) * page_size
    where_sql, args = await build_pg_keyword_where(table, keyword)
    total = await db.fetchval(f"SELECT count(*)::bigint FROM public.{table_name} AS t {where_sql}", *args)
    rows = await db.fetch(
        f"SELECT * FROM public.{table_name} AS t {where_sql} ORDER BY ctid OFFSET ${len(args)+1} LIMIT ${len(args)+2}",
        *args,
        offset,
        page_size,
    )
    total_pages = max(1, math.ceil((total or 0) / page_size))
    return {"rows": rows, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@app.get(f"{API_PREFIX}/pg_meta/getPgTableCount", dependencies=[Depends(require_api_token)])
async def get_pg_table_count(table: str = "", keyword: Optional[str] = None) -> dict[str, Any]:
    table_name = quote_ident(table)
    where_sql, args = await build_pg_keyword_where(table, keyword)
    total = await db.fetchval(f"SELECT count(*)::bigint FROM public.{table_name} AS t {where_sql}", *args)
    return {"total": total}


@app.post(f"{API_PREFIX}/token/createToken", dependencies=[Depends(require_super_token)])
async def create_token(body: dict[str, Any] = Body({})) -> dict[str, Any]:
    data = clean_body(body)
    token_id = uuid.uuid4()
    token_value = generate_access_token(
        secret=jwt_secret(),
        user_id=str(token_id),
        username=str(data.get("username") or "user"),
        valid_days=int(data.get("valid_days") or 365),
    )
    row = await db.fetchrow(
        "INSERT INTO tokens (id, token_value, remark) VALUES ($1,$2,$3) RETURNING *",
        token_id,
        token_value,
        data.get("remark"),
    )
    if row is None:
        raise HTTPException(status_code=500, detail="Token 创建失败")
    return token_body(row)


@app.get(f"{API_PREFIX}/token/getToken", dependencies=[Depends(require_super_token)])
async def get_token(token_id: str = "") -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM tokens WHERE id = $1 LIMIT 1", uuid.UUID(token_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Token不存在")
    return token_body(row)


@app.get(f"{API_PREFIX}/token/getTokenList", dependencies=[Depends(require_super_token)])
async def list_tokens() -> dict[str, Any]:
    rows = await db.fetch("SELECT * FROM tokens ORDER BY created_at DESC")
    items = [{"body": token_body(row)} for row in rows]
    return {"items": items, "total": len(items)}


@app.post(f"{API_PREFIX}/token/deleteToken", status_code=204, dependencies=[Depends(require_super_token)])
async def delete_token(body: dict[str, Any] = Body(...)) -> Response:
    await db.execute("DELETE FROM tokens WHERE id = $1", uuid.UUID(str(body["token_id"])))
    return Response(status_code=204)


@app.post(f"{API_PREFIX}/token/updateToken", status_code=204, dependencies=[Depends(require_super_token)])
async def update_token(body: dict[str, Any] = Body(...)) -> Response:
    await db.execute(
        "UPDATE tokens SET is_blacklisted = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        uuid.UUID(str(body["token_id"])),
        bool(body.get("is_blacklisted")),
    )
    return Response(status_code=204)


def token_body(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "token_value": row["token_value"],
        "remark": row.get("remark"),
        "is_blacklisted": bool(row.get("is_blacklisted")),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def run() -> None:
    import uvicorn

    uvicorn.run("app.main:app", host=server_host(), port=server_port(), reload=False)


if __name__ == "__main__":
    run()
