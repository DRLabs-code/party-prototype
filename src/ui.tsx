import { ReactNode, useEffect, useState, useSyncExternalStore } from 'react'

export const haptic = (p: number | number[] = 10) => { try { navigator.vibrate?.(p) } catch { /* */ } }
export const ok = () => haptic([10, 40, 14])
export const bad = () => haptic([30, 40, 30])

// ---------- 路由(hash) ----------
const sub = (f: () => void) => { window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }
export const useRoute = () => useSyncExternalStore(sub, () => location.hash.slice(1) || '/')
export const nav = (p: string, replace = false) => { if (replace) location.replace('#' + p); else location.hash = p }
export const back = (fallback = '/discover') => { if (history.length > 1) history.back(); else nav(fallback) }

// ---------- Toast ----------
type T = { id: number; text: string; kind: 'ok' | 'warn' | 'info' }
let toasts: T[] = [], tid = 0
const tsubs = new Set<() => void>()
export function toast(text: string, kind: T['kind'] = 'info') {
  const t = { id: ++tid, text, kind }
  toasts = [...toasts.slice(-2), t]; tsubs.forEach((f) => f())
  if (kind === 'warn') bad(); else if (kind === 'ok') ok(); else haptic(8)
  setTimeout(() => { toasts = toasts.filter((x) => x.id !== t.id); tsubs.forEach((f) => f()) }, kind === 'warn' ? 4200 : 2800)
}
export function Toasts() {
  const list = useSyncExternalStore((f) => { tsubs.add(f); return () => tsubs.delete(f) }, () => toasts)
  return <div className="toasts" aria-live="polite">{list.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.kind === 'ok' ? '✓ ' : t.kind === 'warn' ? '⚠ ' : ''}{t.text}</div>)}</div>
}

// ---------- 基础组件 ----------
export function Btn({ children, onClick, kind = 'primary', disabled, block, small, ...r }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'danger' | 'soft'; disabled?: boolean; block?: boolean; small?: boolean } & Record<string, unknown>) {
  return <button {...r} className={`btn ${kind}${block ? ' block' : ''}${small ? ' small' : ''}${disabled ? ' off' : ''}`} onClick={() => { haptic(8); onClick?.() }}>{children}</button>
}
export function hueOf(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h }
export function Avatar({ name, size = 56, verified, hue }: { name: string; size?: number; verified?: boolean; hue?: number }) {
  const h = hue ?? hueOf(name), ch = name.replace('示例·', '').slice(0, 1) || '?'
  return (
    <span className={'avatar' + (verified ? ' verified' : '')} style={{ width: size, height: size }} title={verified ? '已真人认证' : undefined}>
      <span className="face" style={{ background: `linear-gradient(135deg, hsl(${h} 70% 70%), hsl(${(h + 50) % 360} 70% 58%))`, fontSize: size * 0.4 }}>{ch}</span>
      {verified && <span className="vbadge" style={{ width: Math.max(16, size * 0.3), height: Math.max(16, size * 0.3), fontSize: Math.max(10, size * 0.18) }}>✓</span>}
    </span>
  )
}
export const VerifiedTag = () => <span className="vtag">已真人认证</span>
export const Demo = () => <span className="demotag">示例</span>
export function Skeleton({ rows = 3, card }: { rows?: number; card?: boolean }) {
  return <div className="skel-wrap">{Array.from({ length: rows }).map((_, i) => (
    <div key={i} className={'skel-row' + (card ? ' card' : '')}><div className="skel c" /><div className="skel-lines"><div className="skel l1" /><div className="skel l2" /></div></div>))}</div>
}
export function useLoading(ms = 550) {
  const [l, setL] = useState(true)
  useEffect(() => { const t = setTimeout(() => setL(false), ms); return () => clearTimeout(t) }, [ms])
  return l
}
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={'switch' + (on ? ' on' : '')} onClick={() => { haptic(10); onChange(!on) }}><i /></button>
}
export function Chip({ on, children, onClick }: { on?: boolean; children: ReactNode; onClick?: () => void }) {
  return <button type="button" className={'chip' + (on ? ' on' : '')} onClick={() => { haptic(6); onClick?.() }}>{children}</button>
}
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const [shown, setShown] = useState(open)
  useEffect(() => { if (open) setShown(true); else { const t = setTimeout(() => setShown(false), 220); return () => clearTimeout(t) } }, [open])
  if (!shown) return null
  return (
    <div className={'overlay' + (open ? ' in' : '')} onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  )
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [shown, setShown] = useState(open)
  useEffect(() => { if (open) setShown(true); else { const t = setTimeout(() => setShown(false), 200); return () => clearTimeout(t) } }, [open])
  if (!shown) return null
  return (
    <div className={'overlay center' + (open ? ' in' : '')} onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>{children}
      </div>
    </div>
  )
}
export function TopBar({ title, onBack, right }: { title: ReactNode; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack ? <button className="iconbtn" aria-label="返回" onClick={() => { haptic(8); onBack() }}>‹</button> : <span className="iconbtn ghost" />}
      <h1>{title}</h1>
      <span className="right">{right ?? <span className="iconbtn ghost" />}</span>
    </header>
  )
}
export function timeAgo(ts: number) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000))
  if (m < 1) return '刚刚'
  if (m < 60) return m + ' 分钟前'
  const h = Math.floor(m / 60)
  return h < 24 ? h + ' 小时前' : Math.floor(h / 24) + ' 天前'
}
export const count = (s: string) => Array.from(s.trim()).length
