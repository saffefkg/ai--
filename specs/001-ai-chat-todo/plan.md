# Implementation Plan: AI 对话与待办网站（可选择性 AI 读取代办）

**Branch**: `001-ai-chat-todo` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ai-chat-todo/spec.md`

## Summary

构建一个单用户本地优先的 AI 对话网站：前端为 React 19 + Vite + TypeScript + Tailwind CSS v4，包含对话区与待办区；用户通过简单的本地账号（用户名 + 密码/PIN）进入；一个清晰可见的权限开关控制 AI 是否能读取代办（默认关闭、只读）。AI 回复经一个极简 Node/Express 后端代理转发至智谱 AI（GLM）接口，API Key 仅存于服务端环境变量，前端以 SSE 流式接收回复。全部业务数据（待办、对话记录、权限设置、账号）存于浏览器 localStorage。

## Technical Context

**Language/Version**: TypeScript 5.5+；Node.js 20+（LTS）；React 19（前端）

**Primary Dependencies**:
- 前端：React 19、Vite（react-ts 模板）、Tailwind CSS v4（`@tailwindcss/vite`）、TypeScript
- 后端：Express，原生 `fetch` 转发智谱接口（不引入额外 AI SDK）
- 测试：Vitest + React Testing Library（前端）

**Storage**: 浏览器 localStorage（待办、对话记录、权限设置、本地账号）。后端为无状态代理，不落盘任何业务数据。

**Testing**: Vitest（组件 + 存储逻辑）；后端 `/api/chat` 冒烟测试；端到端手动验证见 `quickstart.md`

**Target Platform**: 现代桌面/移动浏览器（Chrome、Edge、移动端 Safari）；服务端 Node 20+

**Project Type**: Web 应用（frontend + backend 双层结构）

**Performance Goals**: 回复流式逐字渲染，首字感知 <1s；页面首屏秒开（纯静态 SPA）

**Constraints**:
- 全站中文界面（宪法原则一）
- 禁用蓝紫色渐变（宪法原则二）
- API Key 严禁进入前端 bundle（安全约束）
- 待办数据仅存本地浏览器（隐私，spec Assumptions）

**Scale/Scope**: 单用户本地使用；无跨设备同步；对话 + 待办 + 权限控制三个功能区

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 宪法原则 | 设计要求 | 检查项 |
|----------|----------|--------|
| 一、全站中文 | 所有界面文案、错误提示、AI 系统引导均为中文 | UI 字符串无英文硬编码 |
| 二、禁用蓝紫渐变 | 色板不得使用蓝紫色渐变作背景/按钮/装饰 | Tailwind 设计 token 校验 |
| 三、对话体验优先 | 流式渲染、输入区常驻、防重复提交 | 对话验收场景覆盖 |
| 四、简洁视觉与无障碍 | 低饱和中性色 + 单一强调色，对比度达标 | 设计 token 校验 |
| 五、响应式适配 | 桌面与移动端布局可用，无横向滚动 | 布局验收场景覆盖 |

Gate 结论：**无违规**。设计（本地存储、无状态代理、流式回复）与各项原则一致。后端代理为满足「API Key 不进前端」与隐私可控的必要设计，其复杂度依据记录于 Complexity Tracking。

**Phase 1 后复检**：本地账号哈希存储、localStorage 落盘、`/api/chat` 无状态转发——均不引入宪法冲突，复检通过。

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chat-todo/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/                        # React 19 + Vite + TS + Tailwind v4
├── index.html
├── vite.config.ts               # react + tailwindcss 插件；dev 下 /api 代理到后端
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx                  # 顶层布局：对话区 + 待办区 + 权限开关
    ├── index.css                # @import "tailwindcss";
    ├── types/                   # TodoItem / ChatMessage / PermissionSetting
    ├── components/
    │   ├── ChatArea.tsx         # 消息流 + 输入框 + 流式渲染 + 防重复提交
    │   ├── ChatMessage.tsx
    │   ├── TodoPanel.tsx        # 待办列表（增/删/勾选）
    │   ├── TodoItem.tsx
    │   ├── PermissionToggle.tsx # AI 读取代办开关
    │   └── LoginGate.tsx        # 本地账号登录/注册
    ├── hooks/
    │   ├── useChat.ts           # 对话状态 + SSE 消费
    │   ├── useTodos.ts          # 待办 CRUD（localStorage）
    │   └── usePermission.ts     # 权限开关状态（localStorage）
    └── services/
        ├── chatApi.ts           # POST /api/chat（SSE fetch）
        └── storage.ts           # localStorage 读写封装

backend/                         # Node + Express 无状态代理
├── package.json
├── .env.example                 # ZHIPU_API_KEY= / ZHIPU_MODEL=
├── tsconfig.json
└── src/
    ├── server.ts                # Express 入口；生产环境托管 frontend/dist
    └── routes/
        └── chat.ts              # POST /api/chat → 智谱接口流式转发
```

**Structure Decision**: 采用「frontend + backend」双层结构（模板 Option 2）。前端为纯 SPA，承载全部业务数据（localStorage）；后端仅作智谱 API 的安全代理——避免 API Key 暴露进浏览器 bundle、规避浏览器直连的跨域限制。该选择的依据记录于 Complexity Tracking。

## Complexity Tracking

> 宪法检查无违规；后端代理为满足「API Key 不进前端」这一安全约束的必要复杂度。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 后端代理层 | 智谱 API Key 不能进入前端 bundle；浏览器直连有密钥泄露 + CORS 风险 | 纯前端 + Vite dev proxy 仅在开发环境有效，生产不可用；直连 SDK 会暴露 Key |
