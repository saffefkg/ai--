# Research: AI 对话与待办网站

来源：智谱开放文档（docs.bigmodel.cn）、Tailwind CSS 官方文档、Vite 官方文档、React 生态资料。

## 1. 智谱 AI（GLM）对话接口

**Decision**: 使用智谱开放平台 HTTP 接口 `POST https://open.bigmodel.cn/api/paas/v4/chat/completions`，`Authorization: Bearer <API_KEY>` 鉴权，请求体设置 `stream: true` 走 SSE 流式返回。

**Rationale**: 官方文档确认该接口为 OpenAI 兼容协议，支持流式；流式 chunk 中增量文本为 `choices[0].delta.content`，可选 `delta.reasoning_content`（思考内容），以 `data: [DONE]` 结束。流式满足「对话体验优先」原则（首字秒出）。国际版端点 `https://api.z.ai/api` 可用，但本项目面向中文用户使用国内端点即可。

**Alternatives considered**:
- 智谱官方 Node SDK：封装友好，但本代理仅做透传转发，原生 `fetch` 依赖更少、更易维护
- 非流式请求（`stream: false`）：实现最简单，但首字等待长，违反对话体验优先原则

**决策点**: 默认模型取 `glm-4-flash`（历史免费模型），通过服务端环境变量 `ZHIPU_MODEL` 可覆盖为 `glm-5.2` / `glm-4.5-air` 等更高能力模型。

## 2. 前端技术栈（React + Vite + TS + Tailwind v4）

**Decision**: 以 `npm create vite@latest . -- --template react-ts` 脚手架生成 React + TypeScript 工程；Tailwind CSS v4 通过官方 Vite 插件集成：`npm install tailwindcss @tailwindcss/vite`，在 `vite.config.ts` 注册 `tailwindcss()` 插件，主 CSS 写入 `@import "tailwindcss";`。

**Rationale**: Create React App 已停止维护；Vite 是 React 官方推荐的 SPA 工具链；Tailwind v4 原生提供 Vite 插件安装路径，配置最少、构建快。React 19 为当前稳定版本。

**Alternatives considered**: Next.js（含 SSR）——本项目为纯客户端 SPA，无 SEO/SSR 需求，Vite 更简单（符合简洁原则）。

## 3. API Key 保护与 CORS

**Decision**: 增加极简 Express 后端代理，暴露 `POST /api/chat`；智谱 Key 存于服务端环境变量（`.env`），前端统一请求同源 `/api/chat`。

**Rationale**: 浏览器直连智谱接口会把 API Key 打进前端 bundle（任意用户可见），且有跨域限制。后端代理是生产可用的标准做法；开发时用 Vite dev `server.proxy` 把 `/api` 转发到本地后端端口。

**Alternatives considered**:
- Vite dev proxy 直接指向智谱：仅开发环境有效；且代理注入 Key 仍需服务端进程持有 Key，生产无法复用
- Serverless 函数（Vercel/Cloudflare）：部署成本更高，超出单用户本地使用范围

## 4. 本地账号存储

**Decision**: 账号凭据存 localStorage，采用「用户名 + 密码/PIN」；密码使用 Web Crypto 加盐哈希（SHA-256）后存储，不存明文。

**Rationale**: 符合 spec 选择（Q1=B，简单本地账号、数据存本地设备）。哈希避免明文暴露，虽然本方案仅保护本机浏览器数据。

**Alternatives considered**:
- 服务端账号体系：超出单用户本地范围，与「数据存本地设备」假设冲突
- 明文存储：安全性差，不可取

## 5. 响应式与无障碍

**Decision**: 采用移动优先布局，对话与待办在窄屏纵向堆叠、宽屏双栏；文本对比度满足 WCAG AA。

**Rationale**: spec 宪法原则四/五要求简洁视觉、可访问性与响应式适配，且移动端为主要使用场景之一。

**Alternatives considered**: 桌面优先布局——窄屏需额外适配，成本更高。
