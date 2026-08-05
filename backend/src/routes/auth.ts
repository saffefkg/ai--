// 认证路由（对应 tasks.md T012）：注册 / 登录（更新最近登录时间）/ 登出 / 当前用户
import { Router } from 'express'
import type { Request, Response } from 'express'
import { hashPassword, verifyPassword } from '../services/password.js'
import { createUser, findById, findByUsername, updateLastLoginAt } from '../services/userService.js'
import {
  createSession,
  deleteSession,
  findSessionByToken,
} from '../services/sessionService.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

const USERNAME_MAX = 50
const PASSWORD_MIN = 6

interface PublicUser {
  id: number
  username: string
  lastLoginAt: string | null
  createdAt: string
}

function toPublicUser(user: {
  id: number
  username: string
  last_login_at: string | null
  created_at: string
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  }
}

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, password } = (req.body ?? {}) as Record<string, unknown>
  const name = typeof username === 'string' ? username.trim() : ''
  const pwd = typeof password === 'string' ? password : ''

  if (!name || name.length > USERNAME_MAX) {
    res.status(400).json({ error: `用户名不能为空且不超过 ${USERNAME_MAX} 个字符` })
    return
  }
  if (pwd.length < PASSWORD_MIN) {
    res.status(400).json({ error: `密码至少 ${PASSWORD_MIN} 位` })
    return
  }
  if (await findByUsername(name)) {
    res.status(409).json({ error: '用户名已存在，请直接登录' })
    return
  }

  const { hash, salt } = await hashPassword(pwd)
  const user = await createUser(name, hash, salt)
  const token = await createSession(user.id)
  res.status(201).json({ token, user: toPublicUser(user) })
})

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = (req.body ?? {}) as Record<string, unknown>
  const name = typeof username === 'string' ? username.trim() : ''
  const pwd = typeof password === 'string' ? password : ''

  if (!name || !pwd) {
    res.status(400).json({ error: '请输入用户名和密码' })
    return
  }

  const user = await findByUsername(name)
  if (!user || !(await verifyPassword(pwd, user.salt, user.password_hash))) {
    res.status(401).json({ error: '用户名或密码错误' })
    return
  }

  // 更新最近登录时间（用户信息属性之一）
  await updateLastLoginAt(user.id)
  const fresh = await findById(user.id)
  const token = await createSession(user.id)
  res.json({ token, user: toPublicUser(fresh ?? user) })
})

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  if (token) await deleteSession(token)
  res.status(204).end()
})

// GET /api/auth/me —— 供刷新页面后恢复登录态
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await findById(req.userId as number)
  if (!user) {
    res.status(401).json({ error: '登录已过期，请重新登录' })
    return
  }
  res.json({ user: toPublicUser(user) })
})

// 导出供复用：从 token 解析用户（供登出等场景）
export async function getSessionUser(token: string) {
  return findSessionByToken(token)
}
