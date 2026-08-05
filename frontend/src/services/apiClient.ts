// 前端 API 客户端（对应 tasks.md T014）：自动附带 Bearer token、401 清除登录态、统一中文错误提示
import { getToken, clearToken } from './token'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** 401 触发全局登出事件（useAuth 监听后同步登录态） */
export const AUTH_LOGOUT_EVENT = 'auth:logout'

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(path, { ...options, headers })
  } catch {
    throw new ApiError(0, '无法连接服务器，请检查网络')
  }

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    throw new ApiError(401, '登录已过期，请重新登录')
  }

  if (!res.ok) {
    let message = '请求失败，请稍后重试'
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // 非 JSON 错误体，使用默认文案
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
