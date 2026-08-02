import { Router } from 'express'
import type { Request, Response as ExpressResponse } from 'express'
import { buildTodoSystemContent } from '../prompts/todoPrompt.js'

const ZHIPU_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

interface IncomingMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TodoContext {
  enabled: boolean
  items: Array<{ id: string; text: string; done: boolean }>
}

interface ChatRequestBody {
  messages?: IncomingMessage[]
  model?: string
  todoContext?: TodoContext
}

export const chatRouter = Router()

// 基础系统提示：全站中文（宪法原则一）
const BASE_SYSTEM_PROMPT = '你是 AI 助手。请始终使用中文回答，回答简洁、清晰、友好。'

// 组装发送给智谱的消息：仅当权限开启时注入只读待办上下文（FR-006/007/013）
function buildZhipuMessages(
  messages: IncomingMessage[],
  todoContext?: TodoContext,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const systemMessages: Array<{ role: 'system'; content: string }> = [
    { role: 'system', content: BASE_SYSTEM_PROMPT },
  ]
  if (todoContext?.enabled && Array.isArray(todoContext.items)) {
    systemMessages.push({
      role: 'system',
      content: buildTodoSystemContent(todoContext.items),
    })
  }
  return [...systemMessages, ...messages]
}

chatRouter.post('/', async (req: Request, res: ExpressResponse) => {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) {
    res.status(401).json({ error: '服务未配置，请检查后端 ZHIPU_API_KEY' })
    return
  }

  const body = req.body as ChatRequestBody
  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: '消息不能为空' })
    return
  }
  const last = messages[messages.length - 1]
  if (last.role !== 'user') {
    res.status(400).json({ error: '最后一条消息必须是用户消息' })
    return
  }

  const model = body.model ?? process.env.ZHIPU_MODEL ?? 'glm-4-flash'
  const zhipuMessages = buildZhipuMessages(messages, body.todoContext)

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
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }
  } catch {
    res.write('data: [DONE]\n\n')
  }
  res.end()
})
