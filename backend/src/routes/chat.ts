// 聊天接口（对应 tasks.md T020，US1 版本）：认证后取历史 + 当前输入，SSE 流式转发智谱，
// 用户消息请求时落库、assistant 回复流结束后落库（对话记录存 MySQL）
import { Router } from 'express'
import type { Request, Response as ExpressResponse } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { insertMessage, listMessagesByUser } from '../services/messageService.js'
import { getPermission } from '../services/permissionService.js'
import { listTodos } from '../services/todoService.js'
import { buildTodoSystemContent } from '../prompts/todoPrompt.js'

const ZHIPU_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const HISTORY_LIMIT = 20

interface ChatRequestBody {
  content?: string
  model?: string
}

export const chatRouter = Router()

// 基础系统提示：全站中文（宪法原则一）
const BASE_SYSTEM_PROMPT = '你是 AI 助手。请始终使用中文回答，回答简洁、清晰、友好。'

chatRouter.post('/', requireAuth, async (req: Request, res: ExpressResponse) => {
  const apiKey = process.env.ZHIPU_API_KEY
  const userId = req.userId as number
  if (!apiKey) {
    res.status(401).json({ error: '服务未配置，请检查后端 ZHIPU_API_KEY' })
    return
  }

  const body = req.body as ChatRequestBody
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) {
    res.status(400).json({ error: '消息不能为空' })
    return
  }

  const model = body.model ?? process.env.ZHIPU_MODEL ?? 'glm-4-flash'

  // 从数据库取历史 + 当前输入组装上下文（多轮对话，FR-002）
  const history = await listMessagesByUser(userId, HISTORY_LIMIT)
  const systemMessages: Array<{ role: 'system'; content: string }> = [
    { role: 'system', content: BASE_SYSTEM_PROMPT },
  ]

  // 权限控制（T031，FR-006/007）：仅当开启时读取最新待办注入只读上下文；关闭时不含任何待办数据
  const canReadTodos = await getPermission(userId)
  if (canReadTodos) {
    const todos = await listTodos(userId)
    systemMessages.push({
      role: 'system',
      content: buildTodoSystemContent(
        todos.map((t) => ({ id: String(t.id), text: t.text, done: Boolean(t.done) })),
      ),
    })
  }

  const zhipuMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    ...systemMessages,
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content },
  ]

  // 用户消息落库（即使 AI 失败也保留用户输入）
  await insertMessage(userId, 'user', content)

  let upstream: globalThis.Response
  try {
    upstream = await fetch(ZHIPU_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: zhipuMessages, stream: true }),
    })
  } catch {
    res.status(502).json({ error: 'AI 服务暂时不可用，请稍后重试' })
    return
  }

  if (!upstream.ok || !upstream.body) {
    res.status(502).json({ error: 'AI 服务暂时不可用，请稍后重试' })
    return
  }

  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let assistantContent = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      // 逐行解析 SSE，累积 assistant 增量（用于落库）
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') continue
        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) assistantContent += delta
        } catch {
          // 忽略无法解析的 chunk
        }
      }
      res.write(chunk)
    }
  } catch {
    res.write('data: [DONE]\n\n')
  }
  res.end()

  // assistant 回复落库（空回复不落库）
  if (assistantContent.trim()) {
    await insertMessage(userId, 'assistant', assistantContent.trim())
  }
})
