// 数据库迁移执行器（对应 tasks.md T007）
// 用法：npm run migrate —— 创建数据库（如不存在）并执行 schema.sql
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import mysql from 'mysql2/promise'
import { loadConfig } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function runMigrations(): Promise<void> {
  const { db } = loadConfig()
  // 先不指定 database，确保数据库存在后再执行建表脚本
  const conn = await mysql.createConnection({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    multipleStatements: true,
  })
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    await conn.query(`USE \`${db.database}\``)
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    await conn.query(sql)
    console.log(`数据库迁移完成：${db.database}（users/sessions/messages/todos/permissions 已就绪）`)
  } finally {
    await conn.end()
  }
}

// 直接作为脚本运行时执行（npm run migrate）
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations().catch((err: unknown) => {
    console.error('数据库迁移失败：', (err as Error).message ?? err)
    process.exit(1)
  })
}
