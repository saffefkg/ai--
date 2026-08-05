// 领域模型定义（数据库存储，对应 tasks.md 数据库设计）

/** 待办事项 */
export interface TodoItem {
  id: string
  text: string
  done: boolean
  createdAt: string
}

/** 消息角色 */
export type ChatRole = 'user' | 'assistant'

/** 对话消息 */
export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

/** AI 读取权限设置 */
export interface PermissionSetting {
  aiCanReadTodos: boolean
}
