// 会话 token 持久化（localStorage 键：auth.token）——前端唯一保留的 localStorage 数据
const TOKEN_KEY = 'auth.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // 存储不可用时静默失败
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 忽略
  }
}
