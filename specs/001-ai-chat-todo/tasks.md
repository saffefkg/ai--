# Tasks: AI 对话与待办网站（数据库存储改造）

**Input**: 用户需求「用数据库存储用户信息，主键为 id，属性含用户名、密码、最近登录时间、对话记录」+ 设计文档 `/specs/001-ai-chat-todo/`

**Storage Decision（用户指定，覆盖 plan.md / data-model.md 的 localStorage 方案）**:
- 数据库：**MySQL**（后端连接池 + SQL 迁移脚本）
- 迁移范围：**全部业务数据入库**（用户、会话、对话记录、待办、权限设置）
- 原 plan.md「无状态后端、不落盘」设计作废；后端承担全部持久化，前端不再读写 localStorage 业务数据

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/

**Tests**: 本次需求未要求自动化测试；每个用户故事的「独立验证」以 quickstart.md 手动端到端场景为准。

**Organization**: 任务按用户故事分组，保证每个故事可独立实现、独立验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无未完成任务依赖）
- **[Story]**: 所属用户故事（US1/US2/US3/US4）
- 描述中给出确切文件路径

## 数据库设计（MySQL，utf8mb4）

| 表 | 字段 |
|----|------|
| users | id (PK, AUTO_INCREMENT), username (UNIQUE), password_hash, salt, last_login_at, created_at |
| sessions | id (PK), user_id (FK→users, CASCADE), token_hash (UNIQUE), created_at, expires_at |
| messages | id (PK), user_id (FK→users, CASCADE), role ('user'/'assistant'), content, created_at |
| todos | id (PK), user_id (FK→users, CASCADE), text (≤500), done, created_at |
| permissions | user_id (PK/FK→users, CASCADE), ai_can_read_todos (默认 false), updated_at |

## Path Conventions

- **前端**: `frontend/src/`（React + Vite + TS + Tailwind v4）
- **后端**: `backend/src/`（Node + Express + mysql2）

---

## Phase 1: Setup（共享基础设施）

**Purpose**: 项目初始化与基础配置

- [x] T001 初始化后端工程 backend/：package.json、tsconfig.json，安装 express、mysql2、dotenv 及类型依赖
- [x] T002 [P] 初始化前端工程 frontend/：Vite react-ts 模板 + Tailwind CSS v4（@tailwindcss/vite），frontend/src/index.css 写入 `@import "tailwindcss";`
- [x] T003 [P] 后端配置 backend/src/config.ts 与 backend/.env.example：DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME、PORT=3001、ZHIPU_API_KEY、ZHIPU_MODEL
- [x] T004 [P] 配置 frontend/vite.config.ts：dev 下 /api 代理 → http://localhost:3001

---

## Phase 2: Foundational（数据库 + 认证——阻塞性前置）

**Purpose**: MySQL 建库建表、连接池、用户注册/登录/会话认证与前端登录门禁。**此阶段未完成前不得开始任何用户故事。**

**⚠️ CRITICAL**: 本阶段未完成前，任何用户故事不得开始

- [x] T005 创建建库建表脚本 backend/src/db/schema.sql：users/sessions/todos/permissions/messages 五表（含外键、索引、utf8mb4、CREATE TABLE IF NOT EXISTS）
- [x] T006 [P] 实现数据库连接池 backend/src/db/pool.ts（mysql2/promise，读取 config，连接失败给出中文错误提示）
- [x] T007 实现迁移执行器 backend/src/db/migrate.ts：CREATE DATABASE IF NOT EXISTS + 执行 schema.sql，注册为 backend/package.json scripts.migrate
- [x] T008 [P] 实现密码哈希工具 backend/src/services/password.ts（node:crypto scrypt + 随机 salt，提供 hash/verify，不存明文密码）
- [x] T009 实现用户服务 backend/src/services/userService.ts：create / findByUsername / updateLastLoginAt（username 唯一约束）
- [x] T010 [P] 实现会话服务 backend/src/services/sessionService.ts：crypto.randomBytes 生成 token，SHA-256 哈希落库，create/validate/delete，默认 7 天过期
- [x] T011 实现认证中间件 backend/src/middleware/auth.ts：解析 Authorization: Bearer <token> → 校验会话 → 注入 req.userId；未认证返回 401 与中文提示
- [x] T012 实现认证路由 backend/src/routes/auth.ts：POST /api/auth/register、POST /api/auth/login（登录成功更新 last_login_at 并返回 token）、POST /api/auth/logout、GET /api/auth/me
- [x] T013 组装 Express 入口 backend/src/server.ts：json 中间件、挂载 /api/auth、统一错误处理（不泄露内部信息）、生产托管 frontend/dist
- [x] T014 [P] 前端 API 客户端 frontend/src/services/apiClient.ts：fetch 封装，自动附带 Bearer token，401 时清除登录态，统一中文错误提示
- [x] T015 前端认证 API frontend/src/services/authApi.ts：register/login/logout/me（依赖 T014）
- [x] T016 前端登录态 hook frontend/src/hooks/useAuth.ts：登录/登出/启动时校验 token（token 存 localStorage `auth.token`，刷新后自动恢复登录态）
- [x] T017 前端登录门禁 frontend/src/components/LoginGate.tsx：注册/登录表单（中文文案、密码输入）与错误提示；frontend/src/App.tsx 未登录渲染 LoginGate、已登录渲染主界面

**Checkpoint**: 注册/登录/登出/刷新保持登录可用；MySQL 五表已建立。

---

## Phase 3: User Story 1 - 用户与 AI 对话（Priority: P1）🎯 MVP

**Goal**: 登录用户可与 AI 多轮对话；消息与 AI 回复写入 MySQL messages 表，刷新后历史保留可继续。

**Independent Test**: 登录 → 输入中文消息 → AI 流式逐字回复；刷新 → 历史消息仍在，可继续追问（对应 quickstart S2）。

### Implementation for User Story 1

- [x] T018 [P] [US1] 实现对话记录服务 backend/src/services/messageService.ts：按用户插入消息、按时间升序取历史
- [x] T019 [US1] 实现历史接口 backend/src/routes/messages.ts：GET /api/messages（认证）返回当前用户历史消息，并在 backend/src/server.ts 挂载
- [x] T020 [US1] 改造后端聊天接口 backend/src/routes/chat.ts：认证后取历史 + 当前输入组装请求，SSE 流式转发智谱；请求时落库 user 消息、流结束落库 assistant 回复；上游错误返回 502 与中文提示，并在 backend/src/server.ts 挂载
- [x] T021 [P] [US1] 前端消息 API frontend/src/services/messagesApi.ts：GET /api/messages
- [x] T022 [US1] 改造前端对话 hook frontend/src/hooks/useChat.ts：进入加载历史、发送后 SSE 增量渲染、防重复提交
- [x] T023 [US1] 前端对话界面 frontend/src/components/ChatArea.tsx 与 ChatMessage.tsx：消息流 + 输入框 + 流式逐字渲染 + 中文「发送中/失败可重试」状态

**Checkpoint**: 用户故事 1 独立可用（对话 + 历史落库）。

---

## Phase 4: User Story 2 - 管理待办事项（Priority: P1）

**Goal**: 待办 CRUD 按用户存 MySQL；刷新不丢。

**Independent Test**: 登录 → 新增待办 → 出现在列表；勾选完成/取消/删除；刷新后数据仍在（对应 quickstart S3）。

### Implementation for User Story 2

- [x] T024 [P] [US2] 实现待办服务 backend/src/services/todoService.ts：按用户 create/list/toggle/delete
- [x] T025 [US2] 实现待办接口 backend/src/routes/todos.ts：GET/POST /api/todos、PATCH/DELETE /api/todos/:id（认证；text trim 后非空且 ≤500），并在 backend/src/server.ts 挂载
- [x] T026 [P] [US2] 前端待办 API frontend/src/services/todosApi.ts：增删改查
- [x] T027 [US2] 改造前端待办 hook frontend/src/hooks/useTodos.ts：改为调用 /api/todos
- [x] T028 [US2] 前端待办界面 frontend/src/components/TodoPanel.tsx 与 TodoItem.tsx：列表、新增、勾选、删除

**Checkpoint**: 用户故事 1 与 2 独立可用。

---

## Phase 5: User Story 3 - 控制 AI 是否读取代办（Priority: P2）

**Goal**: 权限开关存 MySQL（默认关闭）；开启时 /api/chat 携带最新待办，关闭时 0 泄漏。

**Independent Test**: 关闭时问「我有哪些待办」→ AI 不引用待办；开启后问 → AI 引用当前待办；刷新后开关保持（对应 quickstart S4）。

### Implementation for User Story 3

- [x] T029 [P] [US3] 实现权限服务 backend/src/services/permissionService.ts：按用户 get/update（无记录时默认 false）
- [x] T030 [US3] 实现权限接口 backend/src/routes/permission.ts：GET/PUT /api/permission（认证），并在 backend/src/server.ts 挂载
- [x] T031 [US3] 扩展后端聊天接口 backend/src/routes/chat.ts：请求时读取该用户权限；开启则读取最新待办注入 todoContext（FR-007），关闭则请求体不含任何待办数据（FR-006，0 泄漏）
- [x] T032 [P] [US3] 前端权限 API frontend/src/services/permissionApi.ts：GET/PUT /api/permission
- [x] T033 [US3] 改造前端权限 hook frontend/src/hooks/usePermission.ts：改为调用 /api/permission，默认关闭
- [x] T034 [US3] 前端权限开关 frontend/src/components/PermissionToggle.tsx：明确状态展示、即时反馈、切换时提示「切换前已发送给 AI 的待办无法撤回」

**Checkpoint**: 用户故事 1、2、3 独立可用。

---

## Phase 6: User Story 4 - AI 利用待办提供主动帮助（Priority: P3）

**Goal**: 权限开启时 AI 可基于待办主动总结进度、给出行动建议。

**Independent Test**: 开启权限且有若干待办，问「我有哪些未完成的事？」→ AI 列出未完成项（只读、不虚构）。

### Implementation for User Story 4

- [x] T035 [US4] 扩展后端聊天接口 backend/src/routes/chat.ts：权限开启时构造中文系统提示与待办只读快照注入上下文，指导 AI 主动总结进度/给出建议；待办为空时如实说明「当前没有待办」
- [x] T036 [US4] 多轮上下文组装 backend/src/routes/chat.ts：控制最近 N 条历史 + 当前消息 + 待办摘要的顺序与长度，保证 AI 引用与实际一致、不虚构

**Checkpoint**: 所有用户故事独立可用。

---

## Phase 7: Polish & 跨切面治理

**Purpose**: 影响多个故事的整体改进与合规检查

- [x] T037 [P] 清理 localStorage 遗留：frontend/src/services/storage.ts 移除业务数据读写（仅保留 auth.token 存取），删除旧本地账号逻辑
- [x] T038 [P] 同步设计文档：更新 specs/001-ai-chat-todo/data-model.md（MySQL 实体与存储键）与 quickstart.md（MySQL 安装、schema 迁移命令、启动步骤）
- [x] T039 [P] 宪法合规检查：全站中文（无英文硬编码）、无蓝紫色渐变、375px 无横向滚动、文本对比度达标
- [x] T040 展示最近登录时间：登录页/主界面显示 lastLoginAt（来自 /api/auth/me 返回的 last_login_at），frontend/src/components/LoginGate.tsx 与主界面布局
- [x] T041 安全加固 backend：SQL 全参数化（防注入）、密码哈希参数合理、会话过期清理、错误响应不泄露内部信息
- [x] T042 端到端验证 specs/001-ai-chat-todo/quickstart.md：S1 数据库登录、S2 对话、S3 待办、S4 权限、S5 合规、S6 主动帮助全部通过

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成；**阻塞所有用户故事**
- **用户故事 (Phase 3-6)**: 均依赖 Foundational（登录 + 建表后才有数据可读写）
- **Polish (Phase 7)**: 依赖所需用户故事全部完成

### User Story Dependencies

- **US1 (P1)**: 依赖 Phase 2 认证与数据库；无其他故事依赖
- **US2 (P1)**: 依赖 Phase 2；与 US1 并行（不同文件）
- **US3 (P2)**: 依赖 US1（聊天接口扩展）与 US2（待办数据读取）
- **US4 (P3)**: 依赖 US3（权限开启才有待办上下文）

### Within Each User Story

- 服务（Service）先于路由（Route）
- 路由先于前端 hook / 界面
- 核心实现先于集成

### Parallel Opportunities

- Phase 1: T002 + T003 + T004 可并行
- Phase 2: T006 + T008 + T010 + T014 可并行（T005→T007、T009、T011→T012→T013 依序；T014→T015→T016→T017 依序）
- 各故事内的 [P] 任务可并行
- Phase 3-6 在 Foundational 完成后可并行实施（前后端不同模块文件）
- Phase 7: T037 + T038 + T039 可并行

---

## Parallel Example: User Story 1

```bash
# 服务层与前端 API 层并行：
Task: "T018 实现对话记录服务 backend/src/services/messageService.ts"
Task: "T021 前端消息 API frontend/src/services/messagesApi.ts"

# 后端路由（依赖服务）与前端界面并行：
Task: "T020 改造后端聊天接口 backend/src/routes/chat.ts"
Task: "T023 前端对话界面 frontend/src/components/ChatArea.tsx 与 ChatMessage.tsx"
```

---

## Implementation Strategy

### MVP First（先交付 US1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（数据库 + 认证，**关键阻塞**）
3. 完成 Phase 3: US1（对话 + 消息落库）——**MVP**
4. **STOP and VALIDATE**: 登录 → 对话 → 刷新历史保留
5. 演示/交付 MVP

### Incremental Delivery

1. Setup + Foundational → 基础设施就绪（注册/登录可用）
2. 加入 US1 → 独立验证 → 交付（MVP：对话可用）
3. 加入 US2 → 独立验证 → 交付（+待办可用）
4. 加入 US3 → 独立验证 → 交付（+权限控制）
5. 加入 US4 → 独立验证 → 交付（+AI 主动帮助）
6. 每个故事在不破坏既有功能的前提下增量交付

### Parallel Team Strategy

多人并行时：先共同完成 Setup + Foundational；之后开发者 A 做 US1、开发者 B 做 US2；US3 依赖二者后端接口的扩展；US4 最后。

---

## Notes

- [P] 任务 = 不同文件、无未完成依赖
- [Story] 标签将任务映射到具体用户故事
- 每个用户故事应可独立完成与验证
- 验证路径：quickstart.md S1–S6（本需求未要求 TDD）
- 每完成一个任务或逻辑组提交一次
- 可在任一 Checkpoint 停下独立验证故事
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖
