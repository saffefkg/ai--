// 领域模型定义（对应 data-model.md）

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

/** 本地账号 */
export interface Account {
  username: string
  passwordHash: string
  salt: string
  createdAt: string
}

/** 请求代理时的待办上下文（只读快照） */
export interface TodoContext {
  enabled: boolean
  items: TodoItem[]
}
