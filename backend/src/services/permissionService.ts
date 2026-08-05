// 权限服务（对应 tasks.md T029）：permissions 表按用户读写，无记录时默认 false（FR-006）
import type { RowDataPacket } from 'mysql2'
import { getPool } from '../db/pool.js'

export async function getPermission(userId: number): Promise<boolean> {
  const [rows] = await getPool().execute<RowDataPacket[]>(
    'SELECT ai_can_read_todos FROM permissions WHERE user_id = ?',
    [userId],
  )
  const row = rows[0] as { ai_can_read_todos?: number } | undefined
  return Boolean(row?.ai_can_read_todos)
}

export async function setPermission(userId: number, value: boolean): Promise<void> {
  await getPool().execute(
    'INSERT INTO permissions (user_id, ai_can_read_todos) VALUES (?, ?) ON DUPLICATE KEY UPDATE ai_can_read_todos = VALUES(ai_can_read_todos)',
    [userId, value],
  )
}
