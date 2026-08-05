// 权限接口（对应 tasks.md T030）：GET/PUT /api/permission（认证）
import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getPermission, setPermission } from '../services/permissionService.js'

export const permissionRouter = Router()

permissionRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const enabled = await getPermission(req.userId as number)
  res.json({ aiCanReadTodos: enabled })
})

permissionRouter.put('/', requireAuth, async (req: Request, res: Response) => {
  const body = req.body as { aiCanReadTodos?: unknown }
  if (typeof body.aiCanReadTodos !== 'boolean') {
    res.status(400).json({ error: '参数无效' })
    return
  }
  await setPermission(req.userId as number, body.aiCanReadTodos)
  res.json({ aiCanReadTodos: body.aiCanReadTodos })
})
