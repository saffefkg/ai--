import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chatRouter } from './routes/chat.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3001)

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/chat', chatRouter)

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

app.listen(PORT, () => {
  console.log(`后端代理已启动: http://localhost:${PORT}`)
})
