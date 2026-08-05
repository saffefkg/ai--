// 待办 API（对应 tasks.md T026）：增删改查
import { api } from './apiClient'
import type { TodoItem } from '../types/models'

interface TodoDto {
  id: string
  text: string
  done: boolean
  createdAt: string
}

export async function getTodos(): Promise<TodoItem[]> {
  const data = await api<{ todos: TodoItem[] }>('/api/todos')
  return data.todos
}

export async function createTodo(text: string): Promise<TodoItem> {
  const data = await api<{ todo: TodoDto }>('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
  return data.todo
}

export async function setTodoDone(id: string, done: boolean): Promise<void> {
  await api<void>(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ done }),
  })
}

export async function deleteTodo(id: string): Promise<void> {
  await api<void>(`/api/todos/${id}`, { method: 'DELETE' })
}
