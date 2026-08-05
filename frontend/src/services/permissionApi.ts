// 权限 API（对应 tasks.md T032）：GET/PUT /api/permission
import { api } from './apiClient'

interface PermissionDto {
  aiCanReadTodos: boolean
}

export async function getPermission(): Promise<boolean> {
  const data = await api<PermissionDto>('/api/permission')
  return data.aiCanReadTodos
}

export async function setPermission(value: boolean): Promise<void> {
  await api<PermissionDto>('/api/permission', {
    method: 'PUT',
    body: JSON.stringify({ aiCanReadTodos: value }),
  })
}
