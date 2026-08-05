// 认证中间件（对应 tasks.md T011）：解析 Bearer token → 注入 req.userId / req.username
import type { NextFunction, Request, Response } from 'express'
import { findSessionByToken } from '../services/sessionService.js'

declare global {
  namespace Express {
    interface Request {
      userId?: number
      username?: string
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  if (!token) {
    res.status(401).json({ error: '未登录，请先登录' })
    return
  }
  const session = await findSessionByToken(token)
  if (!session) {
    res.status(401).json({ error: '登录已过期，请重新登录' })
    return
  }
  req.userId = session.userId
  req.username = session.username
  next()
}
