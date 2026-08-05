// MySQL 连接池（对应 tasks.md T006）
import mysql from 'mysql2/promise'
import { loadConfig } from '../config.js'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    const { db } = loadConfig()
    pool = mysql.createPool({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
      database: db.database,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
      dateStrings: true,
    })
  }
  return pool
}

/** 供启动时探测数据库连接，失败抛出中文提示 */
export async function pingDatabase(): Promise<void> {
  try {
    const conn = await getPool().getConnection()
    conn.release()
  } catch (err) {
    throw new Error(`无法连接数据库（${(err as Error).message}），请检查 backend/.env 的 DB_* 配置`)
  }
}
