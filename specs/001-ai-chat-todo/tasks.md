# Tasks: AI 对话与待办网站（可选择性 AI 读取代办）

**Input**: Design documents from `/specs/001-ai-chat-todo/`

**Prerequisites**: plan.md（已读）、spec.md（用户故事与优先级）、research.md、data-model.md、contracts/

**Tests**: 本规范未显式要求 TDD，故不生成单元测试任务；每个用户故事的「独立测试」通过 `quickstart.md` 的端到端场景手动验证（T033）。

**Organization**: 任务按用户故事分组，保证每个故事可独立实现、独立验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无未完成任务依赖）
- **[Story]**: 所属用户故事（US1/US2/US3/US4）
- 描述中给出确切文件路径

## Path Conventions

- **前端**: `frontend/src/`（React + Vite + TS + Tailwind v4）
- **后端**: `backend/src/`（Node + Express 无状态代理）

---

## Phase 1: Setup（共享基础设施）

**Purpose**: 项目初始化与基础结构

- [x] T001 [P] Scaffold React + Vite + TS 前端工程（`npm create vite@latest frontend -- --template react-ts`）到 `frontend/`
- [x] T002 [P] Scaffold Node + TypeScript + Express 后端工程（`package.json`、`tsconfig.json`、`src/`）到 `backend/`
- [x] T003 配置 Tailwind CSS v4：在 `frontend/` 安装 `tailwindcss` 与 `@tailwindcss/vite`，在 `frontend/vite.config.ts` 注册 `tailwindcss()` 插件，在 `frontend/src/index.css` 写入 `@import "tailwindcss";`（依赖 T001）
- [x] T004 [P] 创建 `backend/.env.example`，含 `ZHIPU_API_KEY=` 与 `ZHIPU_MODEL=glm-4-flash` 占位与注释

---

## Phase 2: Foundational（阻塞性前置）

**Purpose**: 所有用户故事共同依赖的核心基础设施，**必须全部完成后方可开始任何用户故事**

**⚠️ CRITICAL**: 本阶段未完成前，任何用户故事不得开始

- [x] T005 [P] 创建共享领域类型（TodoItem、ChatMessage、PermissionSetting、Account）于 `frontend/src/types/models.ts`
- [x] T006 [P] 实现 localStorage 封装于 `frontend/src/services/storage.ts`（类型化 get/set/remove，覆盖键：todos、chat.messages、permission、account、session.loggedIn）
- [x] T007 实现本地账号服务于 `frontend/src/services/auth.ts`：注册/登录/登出，Web Crypto 加盐 SHA-256 哈希，登录态持久化（依赖 T005、T006）
- [x] T008 实现登录闸门组件 `frontend/src/components/LoginGate.tsx`：注册/登录表单，全中文文案，错误提示（依赖 T007）
- [x] T009 实现 Express 服务入口 `backend/src/server.ts`：JSON body、CORS、健康检查端点、生产环境托管 `frontend/dist`（依赖 T002）
- [x] T010 创建应用壳 `frontend/src/App.tsx`：未登录渲染 LoginGate；已登录渲染响应式双栏布局（对话区 + 待办区）框架（依赖 T008）
- [x] T011 配置 Vite dev 代理于 `frontend/vite.config.ts`：`/api` → `http://localhost:3001`（依赖 T003）

**Checkpoint**: 基础设施就绪——已可登录进入空壳布局，后端健康检查通过，可开始各用户故事

---

## Phase 3: User Story 1 - 用户与 AI 对话（Priority: P1）🎯 MVP

**Goal**: 用户在对话区输入中文消息，AI 回复流式逐字出现，支持多轮上下文。

**Independent Test**: 打开页面 → 输入中文消息并发送 → 回复流式显示；再追问一条 → AI 结合上文回答（对应 quickstart S2）。

### Implementation for User Story 1

- [x] T012 实现聊天客户端于 `frontend/src/services/chatApi.ts`：`POST /api/chat`，ReadableStream 解析 SSE，AbortController 取消，400/401/502 错误映射（依赖 T005）
- [x] T013 实现 useChat 于 `frontend/src/hooks/useChat.ts`：消息列表（持久化到 `chat.messages`）、增量拼接 `delta.content`、发送中状态、防重复提交、错误提示与重试（依赖 T012）
- [x] T014 [P] 创建消息组件 `frontend/src/components/ChatMessage.tsx`：user/assistant 气泡，全中文
- [x] T015 创建对话区 `frontend/src/components/ChatArea.tsx`：消息流 + 输入框，空/纯空白不发请求，流式期间禁用发送按钮，输入区常驻（依赖 T013、T014）
- [x] T016 实现 `POST /api/chat` 流式代理于 `backend/src/routes/chat.ts`：校验 messages 非空且末条为 user；携带 `stream: true` 与 Bearer 转发至智谱 `/chat/completions`；SSE 透传；映射 400/401/502 中文错误（依赖 T009）

**Checkpoint**: 到此 US1 可独立使用——能登录、能对话并流式接收回复

---

## Phase 4: User Story 2 - 管理待办事项（Priority: P1）

**Goal**: 用户在待办区新增、查看、勾选完成/取消、删除待办；刷新后数据不丢失。

**Independent Test**: 新增 → 显示于列表 → 勾选完成 → 刷新 → 状态保持（对应 quickstart S3）。

### Implementation for User Story 2

- [x] T017 实现 useTodos 于 `frontend/src/hooks/useTodos.ts`：增/删/勾选切换，基于 storage.ts 持久化，UUID 生成，trim 后非空且 ≤500 字符校验（依赖 T005、T006）
- [x] T018 [P] 创建待办项组件 `frontend/src/components/TodoItem.tsx`：文本展示、勾选框、删除按钮、完成态样式
- [x] T019 创建待办面板 `frontend/src/components/TodoPanel.tsx`：添加入口 + 列表渲染，全中文文案（依赖 T017、T018）
- [x] T020 将 TodoPanel 接入 `frontend/src/App.tsx` 的待办区（依赖 T010、T019）

**Checkpoint**: US1 与 US2 均可独立工作——对话、待办各自完整可用

---

## Phase 5: User Story 3 - 控制 AI 是否读取代办（Priority: P2）

**Goal**: 用户通过开关控制 AI 是否读取代办；默认关闭；开启后每次请求携带最新待办快照；界面明确显示状态并持久化。

**Independent Test**: 默认关闭时问「我有哪些待办？」→ AI 不引用任何待办；开启后同样提问 → AI 引用当前待办（对应 quickstart S4）。

### Implementation for User Story 3

- [x] T021 实现 usePermission 于 `frontend/src/hooks/usePermission.ts`：默认 `false`，经 storage.ts 持久化（依赖 T006）
- [x] T022 [P] 创建权限开关 `frontend/src/components/PermissionToggle.tsx`：清晰展示开/关状态、切换即时反馈，附注「切换前已发送的待办无法撤回」（中文文案）
- [x] T023 扩展 chatApi 于 `frontend/src/services/chatApi.ts`：权限开启时附带 `todoContext={enabled, items}`（最新待办快照，FR-007）（依赖 T012、T017、T021）
- [x] T024 扩展 useChat 于 `frontend/src/hooks/useChat.ts`：每次请求实时读取权限与最新待办（权限关闭时请求不含任何待办数据，FR-006）（依赖 T013、T023）
- [x] T025 扩展 `backend/src/routes/chat.ts`：接收 `todoContext`，仅当 `enabled=true` 时将其作为只读系统上下文注入 messages（依赖 T016）
- [x] T026 将 PermissionToggle 接入 `frontend/src/App.tsx` 布局（依赖 T010、T022）

**Checkpoint**: US3 可用——权限开关即时生效、刷新保持、关闭零泄漏、开启可引用

---

## Phase 6: User Story 4 - AI 利用待办提供主动帮助（Priority: P3）

**Goal**: 权限开启时，AI 能主动基于待办给出进度总结、提醒与行动建议；引用与实际一致、不虚构；待办为空时如实告知。

**Independent Test**: 开启权限且有多个待办 → 询问「我的待办进度」→ AI 汇总未完成/已完成项（对应 quickstart S4/S5）。

### Implementation for User Story 4

- [x] T027 创建待办感知系统提示词模块 `backend/src/prompts/todoPrompt.ts`：全中文；指示 AI 主动总结进度/提醒/建议；只读不虚构；引用与实际一致；待办为空时如实说「当前没有待办」（依赖 T025）
- [x] T028 将提示词接入 `backend/src/routes/chat.ts` 并验证边界情况：空待办不虚构、已删除待办取最新快照、权限关闭时仅依据消息文本（依赖 T027）

**Checkpoint**: US4 可用——AI 在权限开启下主动利用待办，引用准确、边界可靠

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的整体质量与合规收尾

- [x] T029 [P] 全站中文审查：扫描 `frontend/src/` 所有面向用户文案，确保无英文硬编码（宪法原则一）
- [x] T030 [P] 定义设计 token 于 `frontend/src/index.css`：低饱和中性色 + 单一强调色，**无蓝紫色渐变**（宪法原则二）
- [x] T031 [P] 响应式审查：375px 移动端与桌面端均无横向滚动、无元素重叠（宪法原则五，quickstart S5）
- [x] T032 [P] 无障碍：权限开关与输入框可键盘操作、对比度达标（宪法原则四）
- [x] T033 运行 `quickstart.md` 端到端验证（S1–S5），修复发现的问题
- [x] T034 添加 `README.md`（安装/运行说明）与 `.gitignore`（排除 `backend/.env`）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，可立即开始；T001/T002/T004 可并行
- **Foundational (Phase 2)**: 依赖 Setup 完成；**阻塞所有用户故事**
- **用户故事 (Phase 3+)**: 均依赖 Foundational；US3 依赖 US1+US2，US4 依赖 US3 的 todoContext 注入（T025）；US1 与 US2 可并行
- **Polish (Final Phase)**: 依赖所需用户故事完成

### User Story Dependencies

- **US1 (P1)**: 依赖 Phase 2，无其他故事依赖
- **US2 (P1)**: 依赖 Phase 2，与 US1 并行（不同文件）
- **US3 (P2)**: 依赖 US1（chatApi/useChat）与 US2（useTodos/待办数据）
- **US4 (P3)**: 依赖 US3（todoContext 注入能力）

### Within Each User Story

- 核心实现（services/hooks）先于组件
- 前端请求组装先于后端注入
- 故事完成后独立验证再进入下一优先级

### Parallel Opportunities

- Phase 1: T001 + T002 + T004 可并行
- Phase 2: T005 + T006 + T009 + T011 可并行（T007/T008、T010 依序）
- US1: T012 与 T016 可并行（前端客户端 vs 后端路由），其后 T013/T014 并行
- US1 与 US2 可整体并行（对话文件 vs 待办文件）
- Phase 7: T029–T032 可并行

---

## Parallel Example: User Story 1

```bash
# 并行启动前端客户端与后端路由：
Task: "T012 实现 chatApi（frontend/src/services/chatApi.ts）"
Task: "T016 实现 /api/chat 流式代理（backend/src/routes/chat.ts）"

# 并行启动消息组件与 useChat 之外的纯 UI：
Task: "T013 实现 useChat（frontend/src/hooks/useChat.ts）"
Task: "T014 创建 ChatMessage 组件（frontend/src/components/ChatMessage.tsx）"
```

---

## Implementation Strategy

### MVP First（仅 US1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（关键，阻塞所有故事）
3. 完成 Phase 3: US1（对话）
4. **STOP and VALIDATE**: 运行 quickstart S1 + S2 独立验证
5. 演示/交付 MVP

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. 加入 US1 → 独立验证 → 交付（MVP：对话可用）
3. 加入 US2 → 独立验证 → 交付（+待办可用）
4. 加入 US3 → 独立验证 → 交付（+权限控制）
5. 加入 US4 → 独立验证 → 交付（+AI 主动帮助）
6. 每个故事在不破坏既有功能的前提下增量交付

### Parallel Team Strategy

多开发者时：

1. 团队共同完成 Setup + Foundational
2. Foundational 完成后：
   - 开发者 A: US1（对话）
   - 开发者 B: US2（待办）
3. US1+US2 合并后：
   - 开发者 C: US3（权限控制）
4. US3 完成后：
   - US4（AI 主动帮助）

---

## Notes

- [P] 任务 = 不同文件、无未完成依赖
- [Story] 标签将任务映射到具体用户故事
- 每个用户故事应可独立完成与验证
- 验证路径：quickstart.md S1–S5（本规范未要求 TDD）
- 每完成一个任务或逻辑组提交一次
- 可在任一 Checkpoint 停下独立验证故事
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖
