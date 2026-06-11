# Python Backend

FastAPI replacement for the former Go PostgreSQL API.

## Setup

```bash
cd py_backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The backend reads `.env.local` and `.env` from the project root. It supports:

- `DATABASE_URL`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE`
- `JWT_SECRET`
- `SERVER_HOST`, `SERVER_PORT`

## Run

```bash
python -m app.main
```

The API base path is `http://127.0.0.1:8000/api/v1`.

## Database Schema

PostgreSQL DDL is kept in `db/schema.sql`.

## Test

```bash
PYTHONPATH=. pytest -q tests
python -m compileall app tests
```
