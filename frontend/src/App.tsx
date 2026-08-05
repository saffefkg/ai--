import ChatArea from './components/ChatArea'
import TodoPanel from './components/TodoPanel'
import PermissionToggle from './components/PermissionToggle'
import LoginGate from './components/LoginGate'
import { useAuth } from './hooks/useAuth'
import { useChat } from './hooks/useChat'
import { useTodos } from './hooks/useTodos'
import { usePermission } from './hooks/usePermission'

export default function App() {
  const { user, checking, login, register, logout } = useAuth()

  if (checking) {
    return <div className="flex h-screen items-center justify-center text-ink-500">加载中…</div>
  }
  if (!user) {
    return <LoginGate onLogin={login} onRegister={register} />
  }
  return <Workspace username={user.username} lastLoginAt={user.lastLoginAt} onLogout={logout} />
}

interface WorkspaceProps {
  username: string
  lastLoginAt: string | null
  onLogout: () => void
}

function Workspace({ username, lastLoginAt, onLogout }: WorkspaceProps) {
  const { todos, add, toggle, remove } = useTodos()
  const { enabled, setEnabled } = usePermission()

  const chat = useChat()

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-ink-900">AI 助手</h1>
          <p className="truncate text-xs text-ink-500">
            你好，{username}
            {lastLoginAt ? ` · 最近登录：${formatDateTime(lastLoginAt)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PermissionToggle enabled={enabled} onChange={setEnabled} />
          <button
            type="button"
            className="text-sm text-ink-500 hover:text-ink-700"
            onClick={onLogout}
          >
            退出登录
          </button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:flex-row">
        {/* 对话区 */}
        <section className="min-h-0 flex-1 rounded-xl border border-ink-200 bg-white p-4">
          <ChatArea
            messages={chat.messages}
            streaming={chat.streaming}
            error={chat.error}
            onSend={chat.send}
            onStop={chat.stop}
          />
        </section>
        {/* 待办区 */}
        <section className="min-h-0 w-full rounded-xl border border-ink-200 bg-white p-4 md:w-80">
          <TodoPanel todos={todos} onAdd={add} onToggle={toggle} onRemove={remove} />
        </section>
      </main>
    </div>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
