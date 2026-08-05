// 登录态（对应 tasks.md T016）：登录/登出/刷新后自动恢复（token 存 localStorage auth.token）
import { useCallback, useEffect, useState } from 'react'
import * as authApi from '../services/authApi'
import type { AuthUser } from '../services/authApi'
import { getToken, setToken, clearToken } from '../services/token'
import { AUTH_LOGOUT_EVENT } from '../services/apiClient'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checking, setChecking] = useState(true)

  // 启动时用本地 token 恢复登录态（FR-014：刷新后保持登录）
  useEffect(() => {
    let cancelled = false
    async function restore() {
      if (!getToken()) {
        if (!cancelled) setChecking(false)
        return
      }
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(me)
      } catch {
        // apiClient 已在 401 时清除 token
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  // 401 全局登出事件（apiClient 派发）
  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const res = await authApi.register(username, password)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // 即使登出接口失败也清除本地态
    }
    clearToken()
    setUser(null)
  }, [])

  return { user, checking, login, register, logout }
}
