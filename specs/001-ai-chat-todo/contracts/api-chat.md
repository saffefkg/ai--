# Contract: POST /api/chat

前端 ↔ 后端之间的唯一接口。后端将请求转发至智谱 AI 并流式返回 SSE。前端不直接访问智谱接口。

## Request

`POST /api/chat` · `Content-Type: application/json`

```json
{
  "messages": [
    { "role": "user", "content": "我有哪些未完成的事？" }
  ],
  "model": "glm-4-flash",
  "todoContext": {
    "enabled": true,
    "items": [
      { "id": "1", "text": "写周报", "done": false }
    ]
  }
}
```

| 字段 | 类型 | 规则 |
|------|------|------|
| messages | ChatMessage[] | 非空；最后一条必须为 user；content 非空 |
| model | string \| 可选 | 省略时使用服务端 `ZHIPU_MODEL` |
| todoContext | object \| 可选 | 权限开启时由前端附带 |
| todoContext.enabled | boolean | 权限开关状态；`false` 时后端忽略 `items` |
| todoContext.items | TodoItem[] | 当前待办快照（只读） |

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
- `delta.reasoning_content`（思考内容）可选择展示或忽略，默认不展示。

## Errors

| 状态码 | 场景 | 前端提示（中文） |
|--------|------|------------------|
| 400 | messages 为空或最后一条非 user | 消息无效，请重试 |
| 401 | 服务端未配置 `ZHIPU_API_KEY` | 服务未配置，请联系管理员 |
| 502 | 智谱上游错误 | AI 服务暂时不可用，请稍后重试 |

- 前端在收到错误时展示中文提示并允许用户重试（spec Edge Cases）。

## 安全

- 接口仅做流式代理，不落盘任何业务数据。
- 智谱 Key 仅在服务端读取，永不进入前端。
