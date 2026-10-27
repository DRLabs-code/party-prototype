import { useSyncExternalStore } from 'react'
import { Gender, Vis, DEMO_FRIEND, DEMO_REQUEST_FROM, USERS, deriveTargets } from './data'

export type Profile = {
  nickname: string; gender: Gender; birthday: string; country: string; cityId: string
  orient: string[]; targetGenders: Gender[]; ageMin: number; ageMax: number
  interests: string[]; prefs: Record<string, Vis>; bio: string
}
export type Msg = { id: string; from: 'me' | 'them'; text: string; ts: number }
export type State = {
  email: string; loggedIn: boolean; profile: Profile | null
  verify: 'none' | 'pending' | 'verified'; invisible: boolean; notify: boolean
  seen: Record<string, boolean>
  photos: { id: string; src: string }[]
  videos: { id: string; name: string; dur: number; poster: string }[]
  blogs: { id: string; text: string; ts: number }[]
  squarePosts: { id: string; text: string; ts: number }[]
  counters: { day: string; blog: number; square: number }
  friends: string[]; reqIn: string[]; reqOut: string[]; blocked: string[]; reported: string[]
  chats: Record<string, Msg[]>
}
const KEY = 'party-proto-v1'
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
const empty = (): State => ({
  email: '', loggedIn: false, profile: null, verify: 'none', invisible: false, notify: true, seen: {},
  photos: [], videos: [], blogs: [], squarePosts: [], counters: { day: today(), blog: 0, square: 0 },
  friends: [], reqIn: [], reqOut: [], blocked: [], reported: [], chats: {},
})
let state: State = (() => { try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return empty() } })()
const subs = new Set<() => void>()
export function set(fn: (s: State) => Partial<State>) {
  state = { ...state, ...fn(state) }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* 存储满了 */ }
  subs.forEach((f) => f())
}
export const get = () => state
export function useStore(): State { return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => state) }
export const used = (s: State, k: 'blog' | 'square') => (s.counters.day === today() ? s.counters[k] : 0)
export function bump(k: 'blog' | 'square') { set((s) => ({ counters: { day: today(), blog: used(s, 'blog') + (k === 'blog' ? 1 : 0), square: used(s, 'square') + (k === 'square' ? 1 : 0) } })) }
export const uid = () => Math.random().toString(36).slice(2, 9)
export const seen = (k: string) => !!state.seen[k]
export const markSeen = (k: string) => set((s) => ({ seen: { ...s.seen, [k]: true } }))
export function wipe() { try { localStorage.removeItem(KEY) } catch { /* */ } state = empty(); subs.forEach((f) => f()) }
export const runtimeVideos = new Map<string, string>() // 仅本次会话的视频播放地址,不持久化

export function seedDemo(email: string, p?: Profile) {
  const profile: Profile = p ?? {
    nickname: '示例·小满', gender: '女', birthday: '1998-05-20', country: '澳大利亚', cityId: 'perth',
    orient: ['异性恋'], targetGenders: ['男'], ageMin: 25, ageMax: 38, interests: ['旅行', '咖啡', '美食'],
    prefs: { 浪漫晚餐: 'friends', 旅行同行: 'matches' }, bio: '这是一个示例账号,用来体验原型。',
  }
  const now = Date.now()
  set((s) => ({
    email, loggedIn: true, profile,
    friends: s.friends.length ? s.friends : [DEMO_FRIEND],
    reqIn: s.reqIn.length || s.friends.length ? s.reqIn : [DEMO_REQUEST_FROM],
    chats: Object.keys(s.chats).length ? s.chats : {
      [DEMO_FRIEND]: [
        { id: 'm1', from: 'them', text: '嗨!看到你也喜欢咖啡☕ (示例消息)', ts: now - 3600e3 },
        { id: 'm2', from: 'me', text: '对呀,你常去哪家?', ts: now - 3500e3 },
      ],
      [DEMO_REQUEST_FROM]: [{ id: 'm3', from: 'them', text: '你好,想认识一下你~ (示例消息)', ts: now - 1800e3 }],
    },
  }))
}
export { deriveTargets, USERS }

// 打招呼 / 接受
export function greet(id: string) {
  set((s) => (s.reqOut.includes(id) || s.friends.includes(id) ? {} : { reqOut: [...s.reqOut, id] }))
}
export function acceptFriend(id: string, firstMsg?: string) {
  set((s) => ({
    friends: s.friends.includes(id) ? s.friends : [...s.friends, id],
    reqIn: s.reqIn.filter((x) => x !== id), reqOut: s.reqOut.filter((x) => x !== id),
    chats: firstMsg && !(s.chats[id]?.length) ? { ...s.chats, [id]: [{ id: uid(), from: 'them', text: firstMsg, ts: Date.now() }] } : s.chats,
  }))
}
export function block(id: string) {
  set((s) => ({ blocked: [...new Set([...s.blocked, id])], friends: s.friends.filter((x) => x !== id), reqIn: s.reqIn.filter((x) => x !== id), reqOut: s.reqOut.filter((x) => x !== id) }))
}
export function unblock(id: string) { set((s) => ({ blocked: s.blocked.filter((x) => x !== id) })) }
export function sendMsg(id: string, text: string, from: 'me' | 'them' = 'me') {
  set((s) => ({ chats: { ...s.chats, [id]: [...(s.chats[id] ?? []), { id: uid(), from, text, ts: Date.now() }] } }))
}
