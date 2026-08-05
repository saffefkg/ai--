// 用户服务（对应 tasks.md T009）：users 表的读写
import type { RowDataPacket } from 'mysql2'
import { getPool } from '../db/pool.js'

export interface UserRow {
  id: number
  username: string
  password_hash: string
  salt: string
  last_login_at: string | null
  created_at: string
}

interface UserRowPacket extends RowDataPacket, UserRow {}

export async function findByUsername(username: string): Promise<UserRow | null> {
  const [rows] = await getPool().execute<UserRowPacket[]>(
    'SELECT id, username, password_hash, salt, last_login_at, created_at FROM users WHERE username = ?',
    [username],
  )
  return rows[0] ?? null
}

export async function findById(id: number): Promise<UserRow | null> {
  const [rows] = await getPool().execute<UserRowPacket[]>(
    'SELECT id, username, password_hash, salt, last_login_at, created_at FROM users WHERE id = ?',
    [id],
  )
  return rows[0] ?? null
}

export async function createUser(
  username: string,
  passwordHash: string,
  salt: string,
): Promise<UserRow> {
  await getPool().execute(
    'INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)',
    [username, passwordHash, salt],
  )
  const created = await findByUsername(username)
  if (!created) throw new Error('创建用户失败')
  return created
}

export async function updateLastLoginAt(userId: number): Promise<string> {
  const [result] = await getPool().execute(
    'UPDATE users SET last_login_at = NOW() WHERE id = ?',
    [userId],
  )
  const affected = (result as { affectedRows: number }).affectedRows
  if (affected === 0) throw new Error('用户不存在')
  // 读取数据库写入的实际时间戳
  const [rows] = await getPool().execute<UserRowPacket[]>(
    'SELECT last_login_at FROM users WHERE id = ?',
    [userId],
  )
  return rows[0]?.last_login_at ?? ''
}
