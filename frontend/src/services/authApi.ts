// 认证 API（对应 tasks.md T015）：注册 / 登录 / 登出 / 当前用户
import { api } from './apiClient'

export interface AuthUser {
  id: number
  username: string
  lastLoginAt: string | null
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export function register(username: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout(): Promise<void> {
  return api<void>('/api/auth/logout', { method: 'POST' })
}

export async function me(): Promise<AuthUser> {
  const data = await api<{ user: AuthUser }>('/api/auth/me')
  return data.user
}
