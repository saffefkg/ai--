// 对话状态（对应 tasks.md T022）：进入加载历史、SSE 增量渲染、防重复提交、错误重试
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../types/models'
import { getMessages } from '../services/messagesApi'
import { streamChat } from '../services/chatApi'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const loadedRef = useRef(false)

  // 从数据库加载历史对话（刷新后历史保留，FR-002）
  const loadHistory = useCallback(async () => {
    try {
      const msgs = await getMessages()
      setMessages(msgs)
    } catch {
      // 登录态失效由 apiClient 派发 auth:logout 处理
    }
  }, [])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    void loadHistory()
  }, [loadHistory])

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || streaming) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }
      const assistantId = crypto.randomUUID()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setError('')
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      await streamChat(
        content,
        {
          onDelta: (delta) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m,
              ),
            )
          },
          onDone: () => {
            setStreaming(false)
            abortRef.current = null
            void loadHistory()
          },
          onError: (message) => {
            setStreaming(false)
            abortRef.current = null
            setError(message)
            void loadHistory()
          },
        },
        controller.signal,
      )
    },
    [streaming, loadHistory],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  return { messages, streaming, error, send, stop }
}
