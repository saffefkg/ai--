// localStorage 类型化封装（键定义对应 data-model.md）

export const KEYS = {
  todos: 'todos',
  messages: 'chat.messages',
  permission: 'permission',
  account: 'account',
  loggedIn: 'session.loggedIn',
} as const

type StorageKey = (typeof KEYS)[keyof typeof KEYS]

export function readStorage<T>(key: StorageKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: StorageKey, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 存储不可用（如隐私模式）时静默失败，不影响使用
  }
}

export function removeStorage(key: StorageKey): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // 忽略
  }
}
