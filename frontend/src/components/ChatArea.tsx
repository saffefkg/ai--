import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { ChatMessage } from '../types/models'
import ChatMessageView from './ChatMessage'

interface ChatAreaProps {
  messages: ChatMessage[]
  streaming: boolean
  error: string
  onSend: (text: string) => void
  onStop: () => void
}

export default function ChatArea({ messages, streaming, error, onSend, onStop }: ChatAreaProps) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || streaming) return
    onSend(text)
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-400">开始和 AI 对话吧</p>
        )}
        {messages.map((m) => (
          <ChatMessageView key={m.id} message={m} />
        ))}
      </div>
      {error && (
        <p className="mb-2 text-sm text-danger-500" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={streaming ? 'AI 正在回复…' : '输入消息，按回车发送'}
          disabled={streaming}
          className="min-w-0 flex-1 rounded-lg border border-ink-300 px-3 py-2 focus:border-accent-500 focus:outline-none disabled:opacity-60"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-lg border border-ink-300 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50"
          >
            停止
          </button>
        ) : (
          <button
            type="submit"
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-700"
          >
            发送
          </button>
        )}
      </form>
    </div>
  )
}
