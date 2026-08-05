// 对话历史 API（对应 tasks.md T021）
import { api } from './apiClient'
import type { ChatMessage } from '../types/models'

export async function getMessages(): Promise<ChatMessage[]> {
  const data = await api<{ messages: ChatMessage[] }>('/api/messages')
  return data.messages
}
