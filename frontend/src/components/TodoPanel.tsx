import { useState } from 'react'
import type { FormEvent } from 'react'
import type { TodoItem } from '../types/models'
import { TODO_MAX_LENGTH } from '../hooks/useTodos'
import TodoItemView from './TodoItem'

interface TodoPanelProps {
  todos: TodoItem[]
  onAdd: (text: string) => boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export default function TodoPanel({ todos, onAdd, onToggle, onRemove }: TodoPanelProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) {
      setError('待办内容不能为空')
      return
    }
    if (text.length > TODO_MAX_LENGTH) {
      setError(`待办内容不能超过 ${TODO_MAX_LENGTH} 字`)
      return
    }
    setError('')
    if (onAdd(text)) setDraft('')
  }

  const doneCount = todos.filter((t) => t.done).length

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-2 text-base font-semibold text-ink-900">待办事项</h2>
      <form onSubmit={handleSubmit} className="mb-2 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="添加待办…"
          className="min-w-0 flex-1 rounded-lg border border-ink-300 px-3 py-1.5 text-sm focus:border-accent-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent-600 px-3 py-1.5 text-sm text-white hover:bg-accent-700"
        >
          添加
        </button>
      </form>
      {error && (
        <p className="mb-2 text-xs text-danger-500" role="alert">
          {error}
        </p>
      )}
      {todos.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-400">暂无待办，添加一条开始吧</p>
      ) : (
        <>
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {todos.map((t) => (
              <TodoItemView key={t.id} todo={t} onToggle={onToggle} onRemove={onRemove} />
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-400">
            已完成 {doneCount} / {todos.length}
          </p>
        </>
      )}
    </div>
  )
}
