// 对话客户端（对应 tasks.md T020 前端侧）：POST /api/chat，解析 SSE 流式回复
// 契约已改为服务端取历史：请求体仅 { content }，历史与权限上下文由后端从数据库组装
import { getToken } from './token'

export interface ChatStreamHandlers {
  onDelta: (text: string) => void
  onDone: () => void
  onError: (message: string) => void
}

export async function streamChat(
  content: string,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      handlers.onDone()
      return
    }
    handlers.onError('无法连接 AI 服务，请检查网络')
    return
  }

  if (!res.ok) {
    let message = '请求失败，请稍后重试'
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // 非 JSON 错误体，使用默认文案
    }
    if (res.status === 401) window.dispatchEvent(new Event('auth:logout'))
    handlers.onError(message)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    handlers.onError('无法读取回复流')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
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
          const content = parsed.choices?.[0]?.delta?.content
          if (content) handlers.onDelta(content)
        } catch {
          // 忽略无法解析的 chunk
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      handlers.onDone()
      return
    }
    handlers.onError('连接中断，请重试')
    return
  }
  handlers.onDone()
}
