// 待办接口（对应 tasks.md T025）：GET/POST /api/todos、PATCH/DELETE /api/todos/:id（认证，按用户隔离）
import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createTodo, deleteTodo, listTodos, setTodoDone } from '../services/todoService.js'

export const todosRouter = Router()

const TODO_MAX = 500

interface TodoBody {
  text?: string
  done?: boolean
}

function toPublicTodo(row: { id: number; text: string; done: boolean; created_at: string }) {
  return { id: String(row.id), text: row.text, done: Boolean(row.done), createdAt: row.created_at }
}

todosRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId as number
  const rows = await listTodos(userId)
  res.json({ todos: rows.map(toPublicTodo) })
})

todosRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId as number
  const body = req.body as TodoBody
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    res.status(400).json({ error: '待办内容不能为空' })
    return
  }
  if (text.length > TODO_MAX) {
    res.status(400).json({ error: `待办内容不能超过 ${TODO_MAX} 字` })
    return
  }
  const id = await createTodo(userId, text)
  res.status(201).json({ todo: toPublicTodo({ id, text, done: false, created_at: new Date().toISOString() }) })
})

todosRouter.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId as number
  const todoId = Number(req.params.id)
  const body = req.body as TodoBody
  if (!Number.isInteger(todoId) || typeof body.done !== 'boolean') {
    res.status(400).json({ error: '参数无效' })
    return
  }
  const ok = await setTodoDone(userId, todoId, body.done)
  if (!ok) {
    res.status(404).json({ error: '待办不存在' })
    return
  }
  res.status(204).end()
})

todosRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId as number
  const todoId = Number(req.params.id)
  if (!Number.isInteger(todoId)) {
    res.status(400).json({ error: '参数无效' })
    return
  }
  const ok = await deleteTodo(userId, todoId)
  if (!ok) {
    res.status(404).json({ error: '待办不存在' })
    return
  }
  res.status(204).end()
})
