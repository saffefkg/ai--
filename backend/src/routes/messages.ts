// 对话历史接口（对应 tasks.md T019）：GET /api/messages 返回当前用户历史消息
import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listMessagesByUser } from '../services/messageService.js'

export const messagesRouter = Router()

const HISTORY_LIMIT = 50

messagesRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId as number
  const rows = await listMessagesByUser(userId, HISTORY_LIMIT)
  res.json({
    messages: rows.map((r) => ({
      id: String(r.id),
      role: r.role,
      content: r.content,
      createdAt: r.created_at,
    })),
  })
})
