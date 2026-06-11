# auto-web-msg-next

Instagram / Facebook 自动化消息发送 + 用户数据抓取工具。
基于三层架构：**Next.js 客户端**（UI）+ **Next.js 后端**（Server Actions + Playwright）+ **Python 服务端**（FastAPI + PostgreSQL + JWT）

浏览器集群管理采用 **AdsPower Local API** 直连方案，通过 CDP 将 AdsPower 托管的浏览器纳入 Playwright 统一控制。

---

## 核心功能

| 功能 | 路由 | 说明 |
|---|---|---|
| AdsPower 浏览器管理 | `/browser-manager` | 列出 AdsPower 环境、启动/停止实例、一键查活并连接 Playwright |
| 全局屏幕监控 | 浮窗（右下角） | SSE 实时推流已接管浏览器的截图，支持全屏展示 |
| 主页实例面板 | `/` (HomePage) | 查看内存中已连接实例、管理 Cookie、单条/批量消息发送 |
| Following 抓取 | `/getdata` | 输入 userid + headers，自动分页抓取 Instagram Following 列表入库 |
| 用户数据增强 | `/extra-data` | 对库中用户逐一打开主页，抓取粉丝数 + IP 属地 |
| PG 数据查看 | `/pgsqlDetails` | PostgreSQL 元数据查看（表列表、列信息、分页数据） |
| 系统设置 | `/settings` | 配置 Headers/Cookie/Token、Token 管理、浏览器检测 |

---

## 技术栈

- **前端**：Next.js App Router + React 19 + TypeScript + Tailwind CSS 4
- **后端（Node.js）**：Next.js Server Actions + Playwright（CDP 控制 Chrome）
  - **One Map 状态架构**：`sessions: Map<string, BrowserSession>` 作为唯一真理来源
  - **AdsPower 集成**：类型安全的自动生成客户端（`src/lib/adspowerapi/generated/`）
- **后端（Python）**：FastAPI + asyncpg + PostgreSQL
- **配置**：`auto-web-msg-next.json`（存储 Token/Cookie/Headers/AdsPower 端点，由 Server Actions 读写）

---

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env.local`：

```env
PYTHON_API_URL=http://127.0.0.1:8000
AUTO_WEB_MSG_DATA_DIR=              # 可选，默认当前目录
AUTO_WEB_MSG_DEFAULT_PORT=2234      # 可选
```

`.env` 数据库配置示例：

```env
DATABASE_URL=postgres://user:pass@localhost:5432/dbname?sslmode=disable
JWT_SECRET=your-secret-key
```

### 3. 启动 Python 服务端

```bash
cd py_backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.main
# 监听 :8000
```

数据库建表脚本位于 `py_backend/db/schema.sql`。

### 4. 启动 Next.js

```bash
pnpm dev
# 监听 :3000
```

### 5. 配置 AdsPower 端点

访问 `/browser-manager`，在顶部输入框中填入 AdsPower Local API 地址（默认 `http://127.0.0.1:50325`），保存后即可管理环境。

---

## 浏览器实例管理架构

```
AdsPower Local API
  │  getV1UserList    → 列出环境（显示 name 字段）
  │  getV1BrowserStart → 启动 → 返回 ws.puppeteer URL
  │  getV2BrowserProfileActive → 查活 → 返回 ws.puppeteer URL
  │
  ▼
connectAndSaveBrowserSession(userId, wsUrl)   ← 所有启动/查活操作的唯一入口
  │  connectBrowser(userId, wsUrl)  ← Playwright CDP 连接
  │  saveSession(userId, { wsEndpoint, port, status: "running", isExternal: true })
  │
  ▼
sessions: Map<string, BrowserSession>   ← 唯一内存状态源
  │
  ├─ getSessionSnapshot(id)    → 安全快照（不含 BrowserContext）
  ├─ listSessionSnapshots()    → 前端实例列表快照
  ├─ listInstancesAction()     → 融合 AdsPower name/port/status 后发送前端
  ├─ useBrowserManagerStore    → Zustand store（_hooks/），驱动 BrowserManagerClient UI
  └─ SSE /api/browser-sync/screen → 实时截图推流（以 id 为唯一标识）
```

---

## `src` 目录结构

```text
src/
├── api/                        # Python API 类型安全客户端（沿用 OpenAPI 生成类型）
│   ├── client.ts
│   └── generated/
├── app/
│   ├── browser-manager/        # AdsPower 环境管理页面
│   │   └── _components/
│   │       └── BrowserManagerClient.tsx
│   ├── extra-data/             # 用户数据增强
│   │   ├── _components/
│   │   └── _services/
│   ├── getdata/                # Following 抓取
│   │   ├── _components/
│   │   ├── _services/
│   │   └── _stores/
│   ├── pgsqlDetails/           # PG 元数据查看
│   ├── settings/               # 系统设置
│   ├── api/
│   │   └── browser-sync/
│   │       └── screen/route.ts # SSE 截图推流端点
│   ├── _components/            # 页面级公共组件
│   │   ├── BatchTaskPanel.tsx
│   │   ├── CookiePanel.tsx
│   │   ├── FloatingMonitor.tsx # 全局屏幕监控浮窗（SSE）
│   │   ├── MemoryInstancesPanel.tsx  # 内存实例快照面板
│   │   ├── PageForm.tsx
│   │   └── ...
│   └── _services/
├── common/
│   ├── hooks/                  # useInstances / useAutomationConfig 等
│   ├── services/
│   │   ├── browser-actions.ts              # 统一门面（re-export 各子模块）
│   │   ├── browser-instance-actions.ts     # 实例列表 Actions
│   │   ├── browser-cookie-actions.ts       # Cookie Actions
│   │   ├── browser-page-actions.ts         # 页面打开 Actions
│   │   ├── browser-batch-actions.ts        # 批量任务 Actions
│   │   ├── browser-config-actions.ts       # AdsPower 端点 + 自动化配置 Actions
│   │   ├── browser-manager-actions.ts      # AdsPower 环境管理 Actions
│   │   ├── extra-data-actions.ts
│   │   ├── getdata-actions.ts
│   │   └── settings-actions.ts
│   ├── types/
│   └── utils/
├── components/ui/              # shadcn/radix 基础组件
└── lib/
    ├── adspowerapi/            # AdsPower 集成层
    │   ├── client.ts           # getDeviceClient（动态端点）
    │   ├── adspower-bridge.ts  # listAdsPowerProfiles 封装
    │   ├── server-actions.ts   # 端点持久化 Actions
    │   └── generated/          # 自动生成（禁止手改）
    └── browser/
        ├── core/
        │   └── state.ts        # ★ sessions Map + globalConfigState
        ├── managers/
        │   ├── browserManager.ts   # connectBrowser / openBrowserInstance
        │   ├── instanceManager.ts  # getAutomationConfig（全局配置）
        │   ├── pageManager.ts
        │   └── cookieManager.ts
        ├── automation/
        ├── batch/
        └── logging/
```

---

## 开发命令

```bash
pnpm dev              # Next.js 开发服务器
pnpm build            # 生产构建
pnpm lint             # ESLint（目标 0 error）
pnpm generate:api     # 从 Python OpenAPI 同步 TypeScript 类型
pnpm generate:adspower # 从 AdsPower OpenAPI 文档同步类型

cd py_backend && pytest
cd py_backend && python -m compileall app tests
```

---

## 数据库表结构

| 表名 | 用途 |
|---|---|
| `instagram_users` | Instagram 用户信息（id, username, followers_count, ip_location, raw_json 等） |
| `opened_urls` | 页面打开记录（去重用） |
| `send_message_logs` | 消息发送日志 |
| `task_events` | 批量任务事件 |
| `tokens` | API 访问 Token（JWT，支持黑名单） |

---

## Python API 接口规范

Base URL: `http://127.0.0.1:8000/api/v1`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/instagram_users/getInstagramUser` | 获取单个用户 |
| GET | `/instagram_users/listInstagramUsers` | 分页查询用户列表 |
| POST | `/instagram_users/upsertInstagramUser` | 插入或更新用户 |
| POST | `/instagram_users/updateInstagramUserExtra` | 更新粉丝数/属地 |
| POST | `/instagram_users/updateInstagramUserCompletion` | 更新完成状态 |
| GET | `/token/getToken` | 获取单个 Token（需超级密钥） |
| GET | `/token/getTokenList` | 获取 Token 列表（需超级密钥） |
| POST | `/token/createToken` | 创建 Token（需超级密钥） |
| POST | `/token/deleteToken` | 删除 Token（需超级密钥） |
| POST | `/token/updateToken` | 更新 Token 黑名单状态（需超级密钥） |
| GET | `/pg_meta/getPgStatus` | 获取 PG 状态 |
| GET | `/pg_meta/listPgTables` | 获取表列表 |
| GET | `/pg_meta/getPgTableColumns` | 获取表列信息 |
| GET | `/pg_meta/getPgTableRows` | 分页查询表数据 |

> **鉴权**：普通接口通过 `Authorization: Bearer <JWT>` 验证；Token 管理接口仅接受 `JWT_SECRET` 环境变量值作为凭证。

---

## 注意事项

- `auto-web-msg-next.json` 由 Next.js 后端读写，**客户端不得直接操作**
- Token 不得存储在 `localStorage`，必须通过 Server Actions 访问
- Python 后端位于 `py_backend/`
- 修改 API 契约后必须运行 `pnpm generate:api`
- `src/lib/adspowerapi/generated/` 目录自动生成，**禁止手动编辑**
- 下拉菜单中的实例选项统一显示 `name`（AdsPower 环境名称），`React key` 使用 `id`（user_id）
- **`listInstances()` 调用不会破坏 session 内存**：底层通过 `toBrowserInstance()` 纯函数返回快照，`BrowserContext` 不会被删除
