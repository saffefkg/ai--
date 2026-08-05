# Contract: POST /api/chat

> 更新说明：改为数据库存储后，历史对话、权限与待办上下文均由后端从 MySQL 组装，请求体简化为仅 `{ content }`；除本接口外的认证接口见 data-model.md「接口一览」。

前端 ↔ 后端之间的对话接口。后端从数据库取历史与权限/待办上下文，转发至智谱 AI 并流式返回 SSE。前端不直接访问智谱接口。

## Auth

所有请求须携带 `Authorization: Bearer <token>`（登录/注册返回的令牌）。

## Request

`POST /api/chat` · `Content-Type: application/json`

```json
{
  "content": "我有哪些未完成的事？",
  "model": "glm-4-flash"
}
```

| 字段 | 类型 | 规则 |
|------|------|------|
| content | string | 非空；trim 后为空不触发请求 |
| model | string \| 可选 | 省略时使用服务端 `ZHIPU_MODEL` |

服务端自动组装上下文：`[system（基础中文引导 + 权限开启时的待办只读快照）] + [最近 N 条历史对话] + [当前 content]`。

- 权限开启（`permissions.ai_can_read_todos = true`）时注入待办只读上下文（FR-007）；关闭时不含任何待办数据（FR-006）。
- 用户消息请求时落库，assistant 回复流结束后落库。

## Response（成功）

`Content-Type: text/event-stream`，透传智谱 SSE chunk：

```
data: {"choices":[{"delta":{"content":"好的"},"finish_reason":null}]}

data: {"choices":[{"delta":{"content":"，我"},"finish_reason":null}]}

data: {"choices":[{"delta":{"content":""},"finish_reason":"stop"}],"usage":{...}}

data: [DONE]
```

- 前端解析 `choices[0].delta.content` 增量拼接展示。
- 以出现 `finish_reason` 或 `data: [DONE]` 为结束标志。

## Errors

| 状态码 | 场景 | 前端提示（中文） |
|--------|------|------------------|
| 400 | content 为空 | 消息不能为空 |
| 401 | 未登录 / 令牌过期 / 未配置 `ZHIPU_API_KEY` | 请先登录 / 登录已过期 / 服务未配置 |
| 502 | 智谱上游错误 | AI 服务暂时不可用，请稍后重试 |

## 安全

- 接口仅按用户读写自身数据（`user_id` 隔离）。
- 智谱 Key 仅在服务端读取，永不进入前端。
