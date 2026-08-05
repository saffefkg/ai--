# AI 助手（AI 对话 + 待办）

一个 AI 对话网站：支持与 AI 对话、管理待办事项，并可通过开关控制 AI 是否能**读取**你的待办（默认关闭、只读）。用户信息、对话记录、待办与权限设置存于 **MySQL 数据库**。

## 技术栈

- **前端**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **后端**: Node.js + Express（业务 API + 智谱 AI 流式转发代理）
- **数据库**: MySQL 8.x（mysql2；`users` 主键为 `id`，含用户名/密码哈希/最近登录时间，关联 `messages` 对话记录）

## 快速开始

### 前置条件

- Node.js 20+
- 本地 MySQL 8.x（root 或具建库权限的账号）
- 智谱开放平台 API Key（[bigmodel.cn](https://bigmodel.cn) 控制台获取）

### 运行

```bash
# 1. 安装依赖
cd frontend && npm install
cd ../backend && npm install

# 2. 配置（后端：数据库 + 智谱 Key；勿提交 .env）
cp backend/.env.example backend/.env
# 编辑 backend/.env：填入 DB_PASSWORD、ZHIPU_API_KEY，可选 DB_NAME / ZHIPU_MODEL

# 3. 初始化数据库（创建 ai_chat_todo 库与 users/sessions/messages/todos/permissions 五表）
cd backend && npm run migrate

# 4. 启动后端（端口 3001，启动时自检数据库连接）
cd backend && npm run dev

# 5. 启动前端（端口 5173，dev 下 /api 代理到后端）
cd ../frontend && npm run dev
# 浏览器打开 http://localhost:5173
```

> 若后端端口 3001 被占用，可在 `backend/.env` 修改 `PORT`，并用
> `VITE_API_PROXY_TARGET=http://localhost:<新端口> npm run dev` 启动前端。

### 生产部署

```bash
cd frontend && npm run build   # 产出 frontend/dist
cd ../backend && npm run build # 产出 backend/dist
cd backend && npm start        # 由后端托管前端静态文件
```

## 功能

- **数据库账号**：用户名 + 密码注册登录（scrypt 加盐哈希，不存明文），登录更新最近登录时间，刷新保持登录
- **AI 对话**：流式回复、多轮上下文、对话记录落库（刷新后历史保留）
- **待办管理**：新增 / 完成 / 删除，按用户存 MySQL，刷新不丢失
- **权限开关**：默认关闭时 AI 看不到待办（0 泄漏）；开启后每次请求读取最新待办供 AI 参考（只读），AI 可主动总结进度

## 目录结构

```text
frontend/   # React + Vite + TS + Tailwind（仅存登录 token，业务数据均在后端 MySQL）
backend/    # Express：认证/对话/待办/权限 API + 智谱代理（持有 API Key 与数据库凭据）
specs/001-ai-chat-todo/   # Spec Kit 设计文档（spec/plan/research/data-model/contracts/quickstart/tasks）
```

## 设计约束（宪法）

- 全站界面文案使用中文
- 不使用蓝紫色渐变 UI
- 对话体验优先（流式渲染、输入区常驻）
- 简洁视觉与无障碍、响应式适配
