import type { TodoItem } from '../types/models'

interface TodoItemProps {
  todo: TodoItem
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export default function TodoItem({ todo, onToggle, onRemove }: TodoItemProps) {
  return (
    <li className="flex items-center gap-2 py-1.5">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
        className="h-4 w-4 accent-accent-600"
        aria-label={todo.done ? `取消完成：${todo.text}` : `标记完成：${todo.text}`}
      />
      <span
        className={`min-w-0 flex-1 break-all text-sm ${
          todo.done ? 'text-ink-400 line-through' : 'text-ink-800'
        }`}
      >
        {todo.text}
      </span>
      <button
        type="button"
        onClick={() => onRemove(todo.id)}
        className="text-sm text-ink-400 hover:text-danger-500"
        aria-label={`删除：${todo.text}`}
      >
        删除
      </button>
    </li>
  )
}
