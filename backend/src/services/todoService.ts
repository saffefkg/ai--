// 待办服务（对应 tasks.md T024）：todos 表按用户 CRUD
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getPool } from '../db/pool.js'

export interface TodoRow {
  id: number
  text: string
  done: boolean
  created_at: string
}

interface TodoRowPacket extends RowDataPacket, TodoRow {}

export async function listTodos(userId: number): Promise<TodoRow[]> {
  const [rows] = await getPool().execute<TodoRowPacket[]>(
    'SELECT id, text, done, created_at FROM todos WHERE user_id = ? ORDER BY created_at ASC, id ASC',
    [userId],
  )
  return rows
}

export async function createTodo(userId: number, text: string): Promise<number> {
  const [result] = await getPool().execute<ResultSetHeader>(
    'INSERT INTO todos (user_id, text) VALUES (?, ?)',
    [userId, text],
  )
  return result.insertId
}

export async function setTodoDone(
  userId: number,
  todoId: number,
  done: boolean,
): Promise<boolean> {
  const [result] = await getPool().execute<ResultSetHeader>(
    'UPDATE todos SET done = ? WHERE id = ? AND user_id = ?',
    [done, todoId, userId],
  )
  return result.affectedRows > 0
}

export async function deleteTodo(userId: number, todoId: number): Promise<boolean> {
  const [result] = await getPool().execute<ResultSetHeader>(
    'DELETE FROM todos WHERE id = ? AND user_id = ?',
    [todoId, userId],
  )
  return result.affectedRows > 0
}
