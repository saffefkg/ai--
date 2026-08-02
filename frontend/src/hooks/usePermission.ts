// AI 读取权限：默认关闭，经 localStorage 持久化（对应 FR-005/006）
import { useCallback, useState } from 'react'
import type { PermissionSetting } from '../types/models'
import { KEYS, readStorage, writeStorage } from '../services/storage'

export function usePermission() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const stored = readStorage<PermissionSetting | null>(KEYS.permission, null)
    return stored?.aiCanReadTodos ?? false
  })

  const update = useCallback((value: boolean) => {
    setEnabled(value)
    writeStorage<PermissionSetting>(KEYS.permission, { aiCanReadTodos: value })
  }, [])

  return { enabled, setEnabled: update }
}
