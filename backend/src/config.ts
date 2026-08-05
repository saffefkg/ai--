// 后端配置：统一读取环境变量（.env），集中管理默认值（对应 tasks.md T003）
import 'dotenv/config'

export interface DbConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export interface AppConfig {
  port: number
  db: DbConfig
  zhipuApiKey: string
  zhipuModel: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(`缺少环境变量 ${name}，请在 backend/.env 中配置（参考 backend/.env.example）`)
  }
  return value.trim()
}

export function loadConfig(): AppConfig {
  const db: DbConfig = {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'ai_chat_todo',
  }

  return {
    port: Number(process.env.PORT ?? 3001),
    db,
    zhipuApiKey: requireEnv('ZHIPU_API_KEY'),
    zhipuModel: process.env.ZHIPU_MODEL ?? 'glm-4-flash',
  }
}
