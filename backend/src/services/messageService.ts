// 对话记录服务（对应 tasks.md T018）：messages 表按用户读写
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getPool } from '../db/pool.js'

export type MessageRole = 'user' | 'assistant'

export interface MessageRow {
  id: number
  role: MessageRole
  content: string
  created_at: string
}

interface MessageRowPacket extends RowDataPacket, MessageRow {}

export async function insertMessage(
  userId: number,
  role: MessageRole,
  content: string,
): Promise<number> {
  const [result] = await getPool().execute<ResultSetHeader>(
    'INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)',
    [userId, role, content],
  )
  return result.insertId
}

export async function listMessagesByUser(
  userId: number,
  limit: number,
): Promise<MessageRow[]> {
  // 使用 query()（文本协议）：execute() 的预编译对 LIMIT ? 会报 ER_WRONG_ARGUMENTS
  const [rows] = await getPool().query<MessageRowPacket[]>(
    'SELECT id, role, content, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC, id ASC LIMIT ?',
    [userId, Math.floor(limit)],
  )
  return rows
}
