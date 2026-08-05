# Quickstart: AI 对话与待办网站（数据库存储）

端到端验证指南。数据模型见 [data-model.md](./data-model.md)，接口契约见 [contracts/api-chat.md](./contracts/api-chat.md)。

## 前置条件

- Node.js 20+（含 npm）
- **本地 MySQL 8.x**（连接信息写入 `backend/.env` 的 `DB_*`）
- 智谱开放平台账号与 API Key（[bigmodel.cn](https://bigmodel.cn) 控制台获取）

## 安装与运行

```bash
# 1. 安装依赖（前端 + 后端）
cd frontend && npm install
cd ../backend && npm install

# 2. 配置（后端：数据库 + 智谱 Key；勿提交 .env）
cp backend/.env.example backend/.env
# 编辑 backend/.env：填入 DB_PASSWORD、ZHIPU_API_KEY，可选 ZHIPU_MODEL / DB_NAME

# 3. 初始化数据库（创建 ai_chat_todo 库与五张表）
cd backend && npm run migrate

# 4. 启动后端（端口 3001，启动时会自检数据库连接）
cd backend && npm run dev

# 5. 启动前端（端口 5173，dev 下 /api 代理到后端）
cd ../frontend && npm run dev
# 浏览器打开 http://localhost:5173
```

## 端到端验证场景

### S1 数据库账号（FR-012 / FR-014）
1. 打开站点 → 用「用户名 + 密码」注册 → 登录进入主界面。
2. 顶部显示用户名与最近登录时间（来自 `last_login_at`）。
3. 刷新页面 → 保持登录状态（token 校验 `/api/auth/me`）。
4. 退出登录 → 再登录 → 数据仍在（MySQL）。

### S2 AI 对话 · 全站中文（FR-001/002/009）
1. 输入中文问题并发送 → AI 回复**流式逐字**出现，界面全中文。
2. 连续追问 → 回答结合上下文（后端从 messages 表取历史）。
3. 输入空 / 纯空白 → 不发出请求。
4. 刷新后历史消息仍在；停止后端或填错 Key → 中文错误提示，可重试。

### S3 待办管理（FR-003 / FR-004）
1. 新增待办 → 立即出现在列表，输入框清空。
2. 勾选完成 / 取消完成 / 删除。
3. 刷新页面 → 待办内容与状态不丢失（MySQL `todos`）。

### S4 权限开关 · 隐私核心（FR-005/006/007/008）
1. 首次进入默认**关闭**；发送"我有哪些待办？"→ AI 不引用任何待办内容。
2. 打开开关 → 再问 → AI 能列出当前待办（只读），引用与实际一致。
3. 刷新页面 → 开关状态保持（MySQL `permissions`）。
4. 界面明确展示当前开关状态，切换有即时反馈。
5. 待办为空且开关开启时询问 → AI 如实说"当前没有待办"，不虚构。

### S5 设计合规（宪法）
- 所有文案为中文（无英文硬编码）。
- 页面**无蓝紫色渐变**背景/按钮/装饰。
- 桌面与移动宽度（375px）下均无横向滚动、无元素重叠。

### S6 AI 主动帮助（US4，P3）
1. 权限开启且有多个待办，询问"我有哪些未完成的事？"→ AI 列出未完成项（只读）。
2. AI 引用待办与实际内容一致、不虚构；待办为空时如实说明。

## 验收指标

- 首次对话在 1 分钟内完成（SC-001）。
- 新增待办在 30 秒内完成（SC-002）。
- 权限开关操作即时反馈且刷新后保持（SC-003）。
- 权限关闭时待办 **0 泄漏**（SC-004）；开启时引用与实际 **100% 一致**（SC-005）。
