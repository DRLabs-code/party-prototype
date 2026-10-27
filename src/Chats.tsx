import { useEffect, useRef, useState } from 'react'
import { Avatar, Btn, Demo, Modal, Skeleton, TopBar, back, bad, haptic, nav, timeAgo, toast, useLoading } from './ui'
import { SCAM_RE, USERS, cityName } from './data'
import { acceptFriend, markSeen, seen, sendMsg, set, useStore } from './store'
import { UserMenu } from './Discover'

export function Chats() {
  const s = useStore(), loading = useLoading(500), [tab, setTab] = useState<'f' | 'r'>('f')
  const row = (id: string) => USERS.find((u) => u.id === id)!
  const fr = s.friends.map(row).filter(Boolean), rq = s.reqIn.map(row).filter(Boolean)
  return (
    <div className="page withnav">
      <TopBar title="消息" right={<button className="iconbtn" aria-label="好友列表" onClick={() => nav('/friends')}>👥</button>} />
      <div className="banner">⚠️ 聊天只保存在你的手机上,换机/卸载会丢失。<button onClick={() => nav('/settings')}>去备份</button></div>
      <div className="tabs"><button className={tab === 'f' ? 'on' : ''} onClick={() => { haptic(8); setTab('f') }}>好友</button><button className={tab === 'r' ? 'on' : ''} onClick={() => { haptic(8); setTab('r') }}>消息请求{rq.length > 0 && <i className="dot">{rq.length}</i>}</button></div>
      {loading ? <Skeleton rows={4} /> : <div className="cards">
        {(tab === 'f' ? fr : rq).map((u) => { const last = s.chats[u.id]?.slice(-1)[0]; return (
          <button key={u.id} className="card row chatrow" onClick={() => nav('/chat/' + u.id)}>
            <Avatar name={u.name} size={48} verified={u.verified} hue={u.hue} />
            <div className="grow"><div className="nm">{u.name} <Demo /></div><div className="preview">{last ? (last.from === 'me' ? '我:' : '') + last.text : '打个招呼吧'}</div></div>
            <small className="muted">{last ? timeAgo(last.ts) : ''}</small></button>) })}
        {!(tab === 'f' ? fr : rq).length && <div className="empty"><div className="big">💬</div>{tab === 'f' ? '还没有好友聊天。去 发现 打个招呼吧。' : '没有新的消息请求。'}</div>}
      </div>}
    </div>
  )
}

const REPLIES = ['哈哈,真的吗?(示例自动回复)', '听起来不错,周末有空吗?(示例自动回复)', '我也是!你最近在忙什么?(示例自动回复)', '要不要加微信聊?(示例自动回复:用来演示防骗提示)', '好呀~(示例自动回复)']

export function Chat({ id }: { id: string }) {
  const s = useStore(), u = USERS.find((x) => x.id === id), [text, setText] = useState(''), [typing, setTyping] = useState(false)
  const [tip, setTip] = useState(!seen('chat')), [menu, setMenu] = useState(false), end = useRef<HTMLDivElement>(null), ri = useRef(0)
  const msgs = s.chats[id] ?? [], isReq = s.reqIn.includes(id), isFriend = s.friends.includes(id)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, typing])
  if (!u) return <div className="page"><TopBar title="聊天" onBack={() => back('/chats')} /><div className="empty">找不到对话</div></div>
  const scam = msgs.some((m) => SCAM_RE.test(m.text))
  const send = () => {
    const t = text.trim(); if (!t) { bad(); return toast('先输入消息', 'warn') }
    if (!isFriend) { bad(); return toast(isReq ? '先接受对方的招呼,才能回复哦' : '对方接受后,你们可以无限聊天。', 'warn') }
    haptic(10); sendMsg(id, t); setText(''); setTyping(true)
    setTimeout(() => { setTyping(false); sendMsg(id, REPLIES[ri.current++ % REPLIES.length], 'them'); haptic(8) }, 1400)
  }
  return (
    <div className="page chatpage">
      <TopBar title={<span className="ctitle">🔒 {u.name}</span>} onBack={() => back('/chats')} right={<button className="iconbtn" aria-label="更多" onClick={() => setMenu(true)}>···</button>} />
      <div className="lockbar">🔒 端到端加密,服务器不存 · 只保存在你和对方的手机里</div>
      <div className="banner">⚠️ 聊天只存在这台设备上。换手机、清理浏览器数据或卸载,聊天记录会永久丢失。建议在 设置→备份 导出。</div>
      {scam && <div className="banner warn">请注意:对方提到转账、投资或外部链接。陌生人要钱、拉你投资都很可能是骗局。</div>}
      {isReq && <div className="reqbar"><span>{u.name} 想和你打招呼</span><Btn small onClick={() => { acceptFriend(id); toast('已接受,现在可以无限聊天了', 'ok') }}>接受</Btn><Btn small kind="ghost" onClick={() => { set((st) => ({ reqIn: st.reqIn.filter((x) => x !== id) })); nav('/chats') }}>忽略</Btn></div>}
      <div className="msgs">
        <p className="tiny center">{cityName(u.cityId)} · 对话为示例,不会发送给任何人</p>
        {msgs.map((m) => <div key={m.id} className={'bubble ' + m.from}>{m.text}<small>{timeAgo(m.ts)}</small></div>)}
        {typing && <div className="bubble them typing"><i /><i /><i /></div>}
        <div ref={end} />
      </div>
      <div className="inputbar">
        <input value={text} placeholder={isFriend ? '输入消息…' : isReq ? '接受后才能回复' : '对方接受后才能聊天'} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <Btn small onClick={send}>发送</Btn>
      </div>
      <UserMenu open={menu} onClose={() => setMenu(false)} id={id} name={u.name} />
      <Modal open={tip} onClose={() => { setTip(false); markSeen('chat') }} title="聊天说明">
        <p>你们的聊天内容加密传输,<b>只保存在你和对方的手机里</b>,我们的服务器不存、也看不到。</p>
        <p>对方接受后,你们可以无限聊天。聊天不限条数。</p>
        <p className="tiny">换机、清缓存或卸载会丢失聊天,可在 设置→备份 导出。</p>
        <Btn block onClick={() => { setTip(false); markSeen('chat') }}>我知道了</Btn>
      </Modal>
    </div>
  )
}
