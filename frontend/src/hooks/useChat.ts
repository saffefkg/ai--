// 对话状态：消息流、SSE 增量渲染、防重复提交、错误重试
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, TodoContext } from '../types/models'
import { streamChat } from '../services/chatApi'
import { KEYS, readStorage, writeStorage } from '../services/storage'

export interface UseChatOptions {
  /** 由上层提供：当前 AI 读取代办权限与最新待办快照；未开启时返回 null */
  getTodoContext: () => TodoContext | null
}

export function useChat({ getTodoContext }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readStorage<ChatMessage[]>(KEYS.messages, []),
  )
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    writeStorage(KEYS.messages, messages)
  }, [messages])

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
      const history = [...messages, userMsg]

      setMessages(history.concat(assistantMsg))
      setError('')
      setStreaming(true)

      const todoContext = getTodoContext()
      const controller = new AbortController()
      abortRef.current = controller

      await streamChat(
        { messages: history, todoContext: todoContext ?? undefined },
        {
          onDelta: (delta) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m,
              ),
            )
          },
          onDone: () => {
            // 空回复（如被停止/中断）则移除占位气泡
            setMessages((prev) =>
              prev.filter((m) => !(m.id === assistantId && m.content === '')),
            )
            setStreaming(false)
          },
          onError: (message) => {
            setMessages((prev) =>
              prev.filter((m) => !(m.id === assistantId && m.content === '')),
            )
            setError(message)
            setStreaming(false)
          },
        },
        controller.signal,
      )
      abortRef.current = null
    },
    [messages, streaming, getTodoContext],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    setError('')
  }, [])

  return { messages, streaming, error, send, stop, clearChat }
}
