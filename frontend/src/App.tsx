import { useState } from 'react'
import LoginGate from './components/LoginGate'
import ChatArea from './components/ChatArea'
import TodoPanel from './components/TodoPanel'
import PermissionToggle from './components/PermissionToggle'
import { useChat } from './hooks/useChat'
import { useTodos } from './hooks/useTodos'
import { usePermission } from './hooks/usePermission'
import { isLoggedIn, logout } from './services/auth'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn)
  const { todos, add, toggle, remove } = useTodos()
  const { enabled, setEnabled } = usePermission()

  const chat = useChat({
    // 每次请求实时读取：权限开启时附带最新待办快照（FR-006/007）
    getTodoContext: () => (enabled ? { enabled: true, items: todos } : null),
  })

  if (!loggedIn) {
    return <LoginGate onLogin={() => setLoggedIn(true)} />
  }

  function handleLogout() {
    logout()
    setLoggedIn(false)
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-ink-900">AI 助手</h1>
        <div className="flex flex-wrap items-center gap-3">
          <PermissionToggle enabled={enabled} onChange={setEnabled} />
          <button
            type="button"
            className="text-sm text-ink-500 hover:text-ink-700"
            onClick={handleLogout}
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
