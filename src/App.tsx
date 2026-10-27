import { useState } from 'react'
import { Chat, Chats } from './Chats'
import { Discover, Square } from './Discover'
import { Login, Register, Setup, Welcome } from './Auth'
import { Blog, Friends, Me, Settings, UserProfile, Verify } from './Me'
import { Sheet, Toasts, haptic, nav, useRoute } from './ui'
import { useStore } from './store'

const TABS = [['/discover', '发现', '✦'], ['/square', '广场', '🎉'], ['+', '', '+'], ['/chats', '消息', '💬'], ['/me', '我的', '🙂']] as const

export default function App() {
  const route = useRoute(), s = useStore(), [pub, setPub] = useState(false)
  const path = route.split('?')[0]
  let page
  const open = ['/', '/login', '/register'].includes(path)
  if (!s.loggedIn && !open) { setTimeout(() => nav('/', true)); page = null }
  else if (s.loggedIn && !s.profile && path !== '/setup' && !open) { setTimeout(() => nav('/setup', true)); page = null }
  else if (path === '/') page = s.loggedIn && s.profile ? (setTimeout(() => nav('/discover', true)), null) : <Welcome />
  else if (path === '/login') page = <Login />
  else if (path === '/register') page = <Register />
  else if (path === '/setup') page = <Setup />
  else if (path === '/discover') page = <Discover />
  else if (path === '/square') page = <Square />
  else if (path === '/chats') page = <Chats />
  else if (path.startsWith('/chat/')) page = <Chat id={path.slice(6)} />
  else if (path === '/me') page = <Me />
  else if (path === '/blog') page = <Blog />
  else if (path === '/friends') page = <Friends />
  else if (path.startsWith('/user/')) page = <UserProfile id={path.slice(6)} />
  else if (path === '/verify') page = <Verify />
  else if (path === '/settings') page = <Settings />
  else page = <Welcome />
  const showNav = s.loggedIn && !!s.profile && TABS.some(([p]) => p === path)
  return (
    <div className="shell">
      <div className="ribbon">Prototype / 原型演示 — 示例数据</div>
      <div className="app">
        <div className="route" key={path}>{page}</div>
        {showNav && <nav className="bottomnav">{TABS.map(([p, l, ic]) => p === '+'
          ? <button key="+" className="plus" aria-label="发布" onClick={() => { haptic(12); setPub(true) }}>＋</button>
          : <button key={p} className={path === p ? 'on' : ''} onClick={() => { haptic(6); nav(p) }}><span className="ic">{ic}{p === '/chats' && s.reqIn.length > 0 && <i className="dot">{s.reqIn.length}</i>}</span>{l}</button>)}</nav>}
        <Sheet open={pub} onClose={() => setPub(false)} title="发布什么?">
          <div className="pubgrid">
            {([['🖼', '照片', '/me', '最多 9 张'], ['🎬', '视频', '/me', '最多 3 个 ≤60 秒'], ['📝', '博客', '/blog', '每天 3 篇 · 200 字'], ['🎉', '派对广场', '/square', '每天 10 条 · 100 字']] as const).map(([i, t, to, d]) => (
              <button key={t} className="pubitem" onClick={() => { setPub(false); haptic(8); setTimeout(() => nav(to), 120) }}><span>{i}</span><b>{t}</b><small>{d}</small></button>))}
          </div>
        </Sheet>
        <Toasts />
      </div>
    </div>
  )
}
