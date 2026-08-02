import { useState } from 'react'
import type { FormEvent } from 'react'
import { login, register } from '../services/auth'

interface LoginGateProps {
  onLogin: () => void
}

type Mode = 'login' | 'register'

export default function LoginGate({ onLogin }: LoginGateProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = username.trim()
    if (!name) {
      setError('请输入用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register(name, password)
      } else {
        await login(name, password)
      }
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-ink-200 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-semibold text-ink-900">欢迎使用 AI 助手</h1>
        <p className="mb-6 text-sm text-ink-500">
          {mode === 'login'
            ? '登录以进入你的个人工作区'
            : '创建你的本地账号（数据仅保存在本机）'}
        </p>
        <label className="mb-1 block text-sm text-ink-700" htmlFor="username">
          用户名
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-lg border border-ink-300 px-3 py-2 focus:border-accent-500 focus:outline-none"
          autoComplete="username"
        />
        <label className="mb-1 block text-sm text-ink-700" htmlFor="password">
          密码 / PIN
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-ink-300 px-3 py-2 focus:border-accent-500 focus:outline-none"
          autoComplete="current-password"
        />
        {error && (
          <p className="mb-3 text-sm text-danger-500" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-accent-600 py-2 font-medium text-white hover:bg-accent-700 disabled:opacity-50"
        >
          {submitting ? '请稍候…' : mode === 'login' ? '登录' : '注册'}
        </button>
        <button
          type="button"
          onClick={switchMode}
          className="mt-3 w-full text-center text-sm text-ink-500 hover:text-ink-700"
        >
          {mode === 'login' ? '还没有账号？去注册' : '已有账号？去登录'}
        </button>
      </form>
    </div>
  )
}
