interface PermissionToggleProps {
  enabled: boolean
  onChange: (value: boolean) => void
}

export default function PermissionToggle({ enabled, onChange }: PermissionToggleProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-800">允许 AI 读取代办</p>
        <p className="text-xs text-ink-500">
          {enabled ? '已开启，AI 可查看当前待办' : '已关闭，AI 看不到待办'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="允许 AI 读取代办"
        title="切换前已发送的待办内容无法撤回"
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? 'bg-accent-600' : 'bg-ink-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            enabled ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
