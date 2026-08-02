# Data Model: AI 对话与待办网站

全部业务数据存于浏览器 localStorage（单用户本地，spec Assumptions）。后端为无状态代理，不存储业务数据。

## 实体

### TodoItem（待办事项）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识（UUID） |
| text | string | 待办内容，trim 后非空，≤500 字符 |
| done | boolean | 是否完成，默认 false |
| createdAt | string (ISO 8601) | 创建时间 |

- 状态转换：`done` 在 false ↔ true 间切换；取消完成恢复。
- AI 对 TodoItem 为**只读**，不会产生任何写入（FR-013）。

### ChatMessage（对话消息）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识（UUID） |
| role | 'user' \| 'assistant' | 消息角色 |
| content | string | 消息文本，非空 |
| createdAt | string (ISO 8601) | 创建时间 |

- 空消息 / 纯空白消息不产生 ChatMessage、不触发请求。
- `messages` 数组按 createdAt 升序保存当前会话上下文。

### PermissionSetting（AI 读取权限）
| 字段 | 类型 | 说明 |
|------|------|------|
| aiCanReadTodos | boolean | 是否允许 AI 读取代办，**默认 false**（FR-006） |

- 切换后立即生效并持久化；切换前已发送的待办数据不可撤回（见 spec Edge Cases，界面需提示）。

### Account（本地账号）
| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名，唯一（本机） |
| passwordHash | string | 密码加盐 SHA-256 哈希 |
| salt | string | 随机盐值 |
| createdAt | string (ISO 8601) | 创建时间 |

- 登录/注册均在本机完成；刷新后保持登录（FR-014）。
- 明文密码不落盘（research §4）。

## 存储键（localStorage）

| 键 | 值 |
|------|------|
| `todos` | `TodoItem[]` |
| `chat.messages` | `ChatMessage[]` |
| `permission` | `PermissionSetting` |
| `account` | `Account`（未登录时不存在） |
| `session.loggedIn` | 布尔，登录态标记 |

## 数据流向（权限核心）

1. 用户发送消息 → 前端读取 `permission.aiCanReadTodos`。
2. `true`：请求附带 `todoContext = { enabled: true, items: TodoItem[] }`（每次请求读取最新待办，FR-007）。
3. `false`：请求不含任何待办数据（FR-006，0 泄漏）。
4. 后端仅做流式转发，不解析、不存储业务数据。
