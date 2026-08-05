# Data Model: AI 对话与待办网站（数据库存储）

> 更新说明：按用户需求「用数据库存储用户信息，主键为 id，属性含用户名、密码、最近登录时间、对话记录」，存储方案由 localStorage 改为 **MySQL 全量入库**（覆盖原 localStorage 方案）。

全部业务数据（用户、会话、对话记录、待办、权限设置）存于 MySQL。后端承担全部持久化，前端仅保留登录 token（localStorage `auth.token`）。

## 实体（MySQL 表）

### users（用户信息）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED PK AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) UNIQUE NOT NULL | 用户名 |
| password_hash | VARCHAR(255) NOT NULL | 密码 scrypt 哈希 |
| salt | VARCHAR(64) NOT NULL | 随机盐值 |
| last_login_at | DATETIME NULL | **最近登录时间**，登录成功时更新 |
| created_at | DATETIME NOT NULL DEFAULT NOW() | 创建时间 |

### sessions（登录会话）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED PK AUTO_INCREMENT | 主键 |
| user_id | BIGINT UNSIGNED FK→users | 所属用户（CASCADE） |
| token_hash | CHAR(64) UNIQUE NOT NULL | 令牌 SHA-256 哈希（明文令牌只回传客户端） |
| created_at | DATETIME NOT NULL DEFAULT NOW() | 创建时间 |
| expires_at | DATETIME NOT NULL | 过期时间（默认 7 天） |

### messages（对话记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED PK AUTO_INCREMENT | 主键 |
| user_id | BIGINT UNSIGNED FK→users | 所属用户（CASCADE） |
| role | ENUM('user','assistant') NOT NULL | 消息角色 |
| content | TEXT NOT NULL | 消息文本 |
| created_at | DATETIME NOT NULL DEFAULT NOW() | 创建时间 |

- 空消息 / 纯空白消息不落库、不触发请求。
- 同用户消息按 `created_at, id` 升序构成多轮上下文。

### todos（待办事项）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED PK AUTO_INCREMENT | 主键 |
| user_id | BIGINT UNSIGNED FK→users | 所属用户（CASCADE） |
| text | VARCHAR(500) NOT NULL | 待办内容，trim 后非空 |
| done | BOOLEAN NOT NULL DEFAULT FALSE | 是否完成 |
| created_at | DATETIME NOT NULL DEFAULT NOW() | 创建时间 |

- AI 对 todo **只读**（FR-013），不会产生任何写入。

### permissions（AI 读取权限）
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | BIGINT UNSIGNED PK FK→users | 所属用户（CASCADE） |
| ai_can_read_todos | BOOLEAN NOT NULL DEFAULT FALSE | 是否允许 AI 读取代办，**默认 false**（FR-006） |
| updated_at | DATETIME ON UPDATE NOW() | 更新时间 |

## 存储键（前端 localStorage）

| 键 | 值 |
|------|------|
| `auth.token` | 登录令牌（明文），仅用于携带 Bearer 头 |

## 接口一览（后端）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册，返回 token + user |
| POST | /api/auth/login | 登录，更新 last_login_at，返回 token + user |
| POST | /api/auth/logout | 登出，删除会话 |
| GET | /api/auth/me | 当前用户（刷新后恢复登录态） |
| GET | /api/messages | 当前用户历史对话 |
| POST | /api/chat | 对话：后端取历史 + 权限/待办上下文，SSE 流式返回并落库 |
| GET/POST | /api/todos | 待办列表 / 新增 |
| PATCH/DELETE | /api/todos/:id | 标记完成 / 删除 |
| GET/PUT | /api/permission | 读取 / 更新 AI 读取代办开关 |

## 数据流向（权限核心）

1. 用户发送消息 → 后端读取该用户 `permissions.ai_can_read_todos`。
2. `true`：读取最新待办（`todos`），以只读 system 上下文注入请求（FR-007）。
3. `false`：请求不含任何待办数据（FR-006，0 泄漏）。
4. 用户消息请求时落库，assistant 回复流结束后落库。
