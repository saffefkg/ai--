// 待办 CRUD（对应 tasks.md T027）：改为调用 /api/todos，数据存 MySQL
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TodoItem } from '../types/models'
import * as todosApi from '../services/todosApi'

export const TODO_MAX_LENGTH = 500

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const loadedRef = useRef(false)

  const load = useCallback(async () => {
    try {
      const items = await todosApi.getTodos()
      setTodos(items)
    } catch {
      // 登录态失效由 apiClient 处理
    }
  }, [])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    void load()
  }, [load])

  const add = useCallback(async (raw: string): Promise<boolean> => {
    const text = raw.trim()
    if (!text || text.length > TODO_MAX_LENGTH) return false
    try {
      const todo = await todosApi.createTodo(text)
      setTodos((prev) => [...prev, todo])
      return true
    } catch {
      return false
    }
  }, [])

  const toggle = useCallback(
    async (id: string) => {
      const target = todos.find((t) => t.id === id)
      if (!target) return
      const next = !target.done
      // 乐观更新，失败回滚
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: next } : t)))
      try {
        await todosApi.setTodoDone(id, next)
      } catch {
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: target.done } : t)))
      }
    },
    [todos],
  )

  const remove = useCallback(async (id: string) => {
    try {
      await todosApi.deleteTodo(id)
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch {
      // 失败保留原列表
    }
  }, [])

  return { todos, add, toggle, remove }
}
