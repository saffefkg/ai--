import type { ChatMessage } from '../types/models'

export default function ChatMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent-600 text-white'
            : 'border border-ink-200 bg-white text-ink-800'
        }`}
      >
        {message.content || '…'}
      </div>
    </div>
  )
}
