// Express 入口（对应 tasks.md T013）：挂载 /api 路由、统一错误处理、生产托管 frontend/dist
import 'dotenv/config'
import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig } from './config.js'
import { pingDatabase } from './db/pool.js'
import { authRouter } from './routes/auth.js'
import { messagesRouter } from './routes/messages.js'
import { chatRouter } from './routes/chat.js'
import { todosRouter } from './routes/todos.js'
import { permissionRouter } from './routes/permission.js'
import { deleteExpiredSessions } from './services/sessionService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const config = loadConfig()
const PORT = config.port

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/chat', chatRouter)
app.use('/api/todos', todosRouter)
app.use('/api/permission', permissionRouter)

// 生产环境：托管前端构建产物（dev 时由 Vite 负责前端）
const distPath = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(distPath))
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: '接口不存在' })
    return
  }
  res.sendFile(path.join(distPath, 'index.html'))
})

// 统一错误处理：返回中文提示，不泄露内部细节
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('服务异常：', err)
  res.status(500).json({ error: '服务器内部错误，请稍后重试' })
})

async function main() {
  try {
    await pingDatabase()
  } catch (err) {
    console.error((err as Error).message)
    console.error('请先配置 backend/.env 中的 DB_*，并运行 `npm run migrate` 初始化数据库。')
    process.exit(1)
  }

  // 启动时清理过期会话（T041 安全加固的一部分）
  try {
    await deleteExpiredSessions()
  } catch {
    // 清理失败不影响启动
  }

  app.listen(PORT, () => {
    console.log(`后端服务已启动: http://localhost:${PORT}`)
  })
}

main()
