你是一名资深前端架构师，请基于 Next.js + SWR + shadcn/ui 技术栈，设计一套适合中大型 Web 前端项目的工程架构、开发规范、组件规范和最佳实践。

【固定技术栈】

- 框架：Next.js App Router
- 目录：必须使用 src 目录
- 数据请求与缓存：SWR
- 服务端函数：Server Actions / use server
- UI 组件库：shadcn/ui
- 样式：Tailwind CSS
- 语言：TypeScript
- HTTP Client：fetch 封装
- 禁止使用 Next.js Image 组件
- 所有图片必须使用原生 img 标签
- 不允许从 next/image 导入 Image
- 非必要不创建 API Route
- 优先使用 use server 直接调用服务端函数
- API Route 仅用于 Webhook、第三方回调、文件上传代理、必须暴露 HTTP 接口等场景

---

# 一、项目目录结构

请给出完整 src 目录结构，例如：

src/
app/
layout.tsx
page.tsx
providers.tsx

    dashboard/
      page.tsx

    users/
      page.tsx
      [id]/
        page.tsx

components/
ui/
common/
layout/
feature/

features/
user/
actions/
user.action.ts
services/
user.service.ts
hooks/
use-users.ts
use-user-detail.ts
components/
user-table.tsx
user-form.tsx
schemas/
user.schema.ts
types/
user.type.ts

lib/
http/
client.ts
error.ts
swr/
config.ts
keys.ts
server/
auth.ts
db.ts
utils.ts

config/
env.ts

styles/
globals.css

middleware.ts
next.config.ts
tsconfig.json

请解释每个目录职责。

---

# 二、Next.js App Router 架构要求

请说明：

- 必须使用 src/app
- App Router 使用规范
- Server Component 与 Client Component 分工
- page.tsx 只负责页面组合
- Server Component 优先获取首屏数据
- Client Component 只负责交互
- 业务逻辑放 features
- 公共组件放 components
- 工具函数放 lib
- 环境变量统一管理
- 禁止在页面中堆业务逻辑

---

# 三、use server / Server Actions 规范

请重点说明：

- 优先使用 use server 直接调用服务端函数
- 非必要不创建 API Route
- Server Actions 放在 features/\*/actions
- 数据库访问、鉴权校验、权限判断放服务端
- Client Component 通过 action 调用服务端函数
- action 返回统一 Result 结构
- 不在客户端暴露敏感逻辑
- 不在 action 中直接返回数据库原始错误
- action 中统一处理异常并返回业务错误

请给出代码示例：

- features/user/actions/user.action.ts
- features/user/services/user.service.ts
- lib/server/auth.ts
- lib/server/db.ts

---

# 四、SWR 与 Server Actions 结合规范

请说明：

- SWR 仍用于客户端服务端状态缓存
- SWR fetcher 可以直接调用 use server 导出的查询函数
- 首屏数据优先由 Server Component 获取，然后传给 SWR fallbackData
- 新增、编辑、删除使用 Server Action
- 操作成功后使用 mutate 刷新缓存
- 支持乐观更新
- 支持分页、搜索、详情查询
- SWR key 统一管理

请给出代码示例：

- lib/swr/keys.ts
- features/user/hooks/use-users.ts
- features/user/hooks/use-user-detail.ts
- src/app/users/page.tsx
- features/user/components/user-list-client.tsx

---

# 五、API Route 使用边界

必须明确说明：

默认不创建：

- src/app/api/users/route.ts
- src/app/api/auth/route.ts
- src/app/api/\*

优先使用：

- use server
- Server Actions
- Server Component 直接调用服务端函数

只有以下场景才创建 API Route：

- Webhook
- 第三方 OAuth callback
- 第三方支付回调
- 文件上传代理
- 需要给外部系统调用的 HTTP 接口
- SSE / 流式接口
- 特殊跨端接口

请给出错误示例和正确示例。

---

# 六、shadcn/ui 使用规范

请说明：

- shadcn/ui 组件放 src/components/ui
- ui 组件禁止写业务逻辑
- 业务组件放 src/features/\*/components
- 表格、弹窗、表单、按钮、Toast 的推荐写法
- Tailwind className 组织规范
- cn 工具函数使用规范

请给出示例：

- UserTable
- UserForm
- ConfirmDialog
- EmptyState
- LoadingState

---

# 七、表单规范

固定使用：

- React Hook Form
- shadcn/ui Form
- Server Actions

请给出：

- user.schema.ts
- UserForm 示例
- 创建用户
- 编辑用户
- 表单校验
- 提交 loading 状态
- Server Action 错误展示
- 成功后 mutate
- Toast 提示

---

# 八、API / Action 数据类型规范

请说明：

- Action 返回 Result<T>
- DTO 与 ViewModel 拆分
- 数据库模型不直接暴露给客户端
- 分页响应结构
- 错误响应结构

示例：

type ActionResult<T> =
| { success: true; data: T }
| { success: false; error: { code: string; message: string } }

---

# 九、图片使用规范：禁止 Image 组件

必须明确说明：

禁止使用：

import Image from "next/image"

禁止使用：

<Image />

必须使用：

<img src="..." alt="..." />

要求：

- 图片必须写 alt
- 需要懒加载时使用 loading="lazy"
- 需要响应式时使用 Tailwind className
- 外链图片安全策略说明
- 示例中所有图片都必须使用 img 标签

请给出正确示例和错误示例。

---

# 十、页面示例

请给出完整用户管理页面示例：

功能包括：

- Server Component 获取首屏用户列表
- SWR fallbackData
- 用户列表
- 搜索
- 分页
- 新增用户
- 编辑用户
- 删除用户
- loading
- error
- empty
- mutate 刷新
- Toast 提示

要求：

- Next.js App Router
- src 目录
- Server Actions / use server
- SWR
- shadcn/ui
- TypeScript
- 不使用 API Route
- 不使用 Image 组件

---

# 十一、状态管理规范

请说明：

- 服务端状态使用 SWR
- 写操作使用 Server Actions
- 首屏数据使用 Server Component
- 本地 UI 状态使用 useState / useReducer
- 全局状态何时使用 Zustand
- 不要把服务端数据复制进全局 store
- mutate 使用规范

---

# 十二、性能优化

请给出：

- Server Component 优先原则
- Client Component 最小化原则
- useMemo / useCallback 使用边界
- SWR 缓存优化
- fallbackData 使用规范
- 分页和搜索防抖
- 动态导入
- 避免无意义重渲染
- 大列表优化建议

---

# 十三、错误处理与权限

请说明：

- 未登录如何处理
- 401 跳转登录
- 403 显示无权限
- 404 显示资源不存在
- 500 显示系统错误
- Server Action 统一处理错误
- 页面如何展示错误状态
- token / session 如何在服务端读取
- 客户端不直接处理敏感鉴权逻辑

---

# 十四、开发规范

请给出：

- 文件命名规范
- 组件命名规范
- hook 命名规范
- action 命名规范
- service 命名规范
- TypeScript 类型规范
- Tailwind className 规范
- Git 提交规范
- 测试规范

---

# 十五、最终输出要求

- 使用中文回答
- 给出完整、可落地的工程方案
- 代码示例使用 TypeScript
- 使用 src 目录
- 优先使用 use server / Server Actions
- 非必要不创建 API Route
- 重点突出 Next.js + SWR + shadcn/ui
- 所有示例禁止使用 next/image
- 所有图片必须使用原生 img 标签
- 内容适合中大型前端项目

# 十六、代码注释要求（必须严格遵守）

## 1. 文档注释

### 1.1. 必须注释的地方

- 函数定义处，使用文档注释
- 变量定义处，使用注释解释变量的含义
- 关键逻辑必须有注释
- 复杂算法必须有注释

### 1.2. 注释要求

- 必须使用中文
- 注释应简洁明了，说明**为什么**这样做，而不是**怎么做**
- 解释业务逻辑、设计决策、特殊处理
