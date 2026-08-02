# AI 助手（AI 对话 + 待办）

一个本地优先的 AI 对话网站：支持与 AI 对话、管理待办事项，并可通过开关控制 AI 是否能**读取**你的待办（默认关闭、只读）。

## 技术栈

- **前端**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **后端**: Node.js + Express（无状态代理，转发智谱 AI 接口）
- **数据**: 全部存于浏览器 localStorage（单用户本地，无跨设备同步）

## 快速开始

### 前置条件

- Node.js 20+
- 智谱开放平台 API Key（[bigmodel.cn](https://bigmodel.cn) 控制台获取）

### 运行

```bash
# 1. 安装依赖
cd frontend && npm install
cd ../backend && npm install

# 2. 配置智谱 Key（仅后端持有，勿提交 .env）
cp backend/.env.example backend/.env
# 编辑 backend/.env 填入 ZHIPU_API_KEY，可选 ZHIPU_MODEL

# 3. 启动后端代理（端口 3001）
cd backend && npm run dev

# 4. 启动前端（端口 5173，开发环境 /api 自动代理到后端）
cd ../frontend && npm run dev
# 浏览器打开 http://localhost:5173
```

### 生产部署

```bash
cd frontend && npm run build   # 产出 frontend/dist
cd ../backend && npm run build # 产出 backend/dist
cd backend && npm start        # 由后端托管前端静态文件
```

## 功能

- **本地账号**：用户名 + 密码/PIN 注册登录（密码加盐哈希后存本机）
- **AI 对话**：流式回复、多轮上下文、中文界面
- **待办管理**：新增 / 完成 / 删除，刷新不丢失
- **权限开关**：默认关闭时 AI 看不到待办；开启后每次提问携带最新待办快照供 AI 参考（只读）

## 目录结构

```text
frontend/   # React + Vite + TS + Tailwind（业务数据均在浏览器本地）
backend/    # Express 无状态代理（转发智谱接口，持有 API Key）
specs/001-ai-chat-todo/   # Spec Kit 设计文档（spec/plan/research/data-model/contracts/quickstart/tasks）
```

## 设计约束（宪法）

- 全站界面文案使用中文
- 不使用蓝紫色渐变 UI
- 对话体验优先（流式渲染、输入区常驻）
- 简洁视觉与无障碍、响应式适配
