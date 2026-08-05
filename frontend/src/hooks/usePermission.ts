// AI 读取权限（对应 tasks.md T033）：调用 /api/permission，默认关闭（FR-005/006）
import { useCallback, useEffect, useRef, useState } from 'react'
import * as permissionApi from '../services/permissionApi'

export function usePermission() {
  const [enabled, setEnabled] = useState<boolean>(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    void permissionApi
      .getPermission()
      .then(setEnabled)
      .catch(() => {
        // 默认关闭
      })
  }, [])

  const update = useCallback(async (value: boolean) => {
    // 乐观更新，失败时回滚为服务器实际状态
    setEnabled(value)
    try {
      await permissionApi.setPermission(value)
    } catch {
      const current = await permissionApi.getPermission().catch(() => false)
      setEnabled(current)
    }
  }, [])

  return { enabled, setEnabled: update }
}
