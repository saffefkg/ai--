// 待办 CRUD：增/删/勾选切换，localStorage 持久化
import { useCallback, useEffect, useState } from 'react'
import type { TodoItem } from '../types/models'
import { KEYS, readStorage, writeStorage } from '../services/storage'

export const TODO_MAX_LENGTH = 500

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    readStorage<TodoItem[]>(KEYS.todos, []),
  )

  useEffect(() => {
    writeStorage(KEYS.todos, todos)
  }, [todos])

  const add = useCallback((raw: string): boolean => {
    const text = raw.trim()
    if (!text || text.length > TODO_MAX_LENGTH) return false
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false, createdAt: new Date().toISOString() },
    ])
    return true
  }, [])

  const toggle = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { todos, add, toggle, remove }
}
