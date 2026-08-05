// 会话服务（对应 tasks.md T010）：不透明 token，SHA-256 哈希落库，默认 7 天过期
import { createHash, randomBytes } from 'node:crypto'
import type { RowDataPacket } from 'mysql2'
import { getPool } from '../db/pool.js'

const SESSION_TTL_DAYS = 7
const TOKEN_BYTES = 32

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export interface SessionUser {
  userId: number
  username: string
}

interface SessionUserPacket extends RowDataPacket, SessionUser {}

export async function createSession(userId: number): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  await getPool().execute(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, hashToken(token), expiresAt],
  )
  return token
}

export async function findSessionByToken(token: string): Promise<SessionUser | null> {
  const [rows] = await getPool().execute<SessionUserPacket[]>(
    `SELECT s.user_id AS userId, u.username AS username
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > NOW()`,
    [hashToken(token)],
  )
  return rows[0] ?? null
}

export async function deleteSession(token: string): Promise<void> {
  await getPool().execute('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)])
}

export async function deleteExpiredSessions(): Promise<void> {
  await getPool().execute('DELETE FROM sessions WHERE expires_at <= NOW()')
}
