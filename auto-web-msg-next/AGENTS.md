# AGENTS Guide

本项目当前由 Next.js 应用和 Python FastAPI 后端组成。

## 架构

| 层 | 目录 | 职责 |
|---|---|---|
| Next.js UI / Server Actions | `src/` | 页面、浏览器自动化、AdsPower Local API、配置读写 |
| Python API | `py_backend/` | PostgreSQL 数据 API、Token、PG 元数据 |
| 数据库 schema | `py_backend/db/schema.sql` | PostgreSQL 建表脚本 |

数据流向：浏览器页面 -> Server Actions -> Python HTTP API -> PostgreSQL。

AdsPower 数据流向：Server Actions -> AdsPower Local API -> Playwright CDP -> 内存 session。

## 常用命令

```bash
pnpm dev
pnpm lint
pnpm build
pnpm generate:api

cd py_backend
PYTHONPATH=. pytest -q tests
python -m compileall app tests
python -m app.main
```

## 环境变量

- `PYTHON_API_URL`：Python API 地址，默认 `http://127.0.0.1:8000`
- `DATABASE_URL`：PostgreSQL 连接串
- `JWT_SECRET`：Token 签发和超级密钥
- `AUTO_WEB_MSG_DATA_DIR`：运行数据目录
- `AUTO_WEB_MSG_DEFAULT_PORT`：默认浏览器端口

## 代码约定

- API 类型来自 `src/api/generated/`，不要手写重复 DTO。
- 修改 Python API 契约后，启动 Python 后端并运行 `pnpm generate:api`。
- AdsPower API 调用统一走 `src/lib/adspower-api/`。
- Server Actions 返回值统一使用 `ok` / `fail`。
- 不提交 `.next/`、`node_modules/`、`.pytest_cache/`、`__pycache__/`、`.DS_Store`。
