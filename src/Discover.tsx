import { useEffect, useRef, useState } from 'react'
import { Avatar, Btn, Chip, Demo, Modal, Sheet, Skeleton, TopBar, VerifiedTag, count, haptic, nav, timeAgo, toast, useLoading, bad } from './ui'
import { FakeUser, REPORT_REASONS, SQUARE_SEED, USERS, ageOf, cityName, neighborKm } from './data'
import { Profile, acceptFriend, block, bump, greet, markSeen, seen, set, sendMsg, uid, used, useStore, State } from './store'

export function matches(s: State): { u: FakeUser; km: number }[] {
  const p = s.profile; if (!p) return []
  const me = ageOf(p.birthday)
  const out: { u: FakeUser; km: number }[] = []
  for (const u of USERS) {
    if (u.invisible || s.blocked.includes(u.id)) continue
    const km = neighborKm(p.cityId, u.cityId); if (km === null) continue
    if (!p.targetGenders.includes(u.gender) || !u.tg.includes(p.gender)) continue
    if (u.age < p.ageMin || u.age > p.ageMax || me < u.ageMin || me > u.ageMax) continue
    out.push({ u, km })
  }
  return out.sort((a, b) => +b.u.verified - +a.u.verified || a.km - b.km)
}

export function greetUser(u: FakeUser, s: State) {
  if (s.friends.includes(u.id)) return nav('/chat/' + u.id)
  if (s.reqOut.includes(u.id)) return toast('已经打过招呼了,等对方回应吧', 'info')
  greet(u.id)
  toast('已发出招呼。对方接受后,你们可以无限聊天。', 'ok')
  setTimeout(() => { // 原型:示例用户 3 秒后接受
    acceptFriend(u.id, `嗨,谢谢你的招呼!我是${u.name.replace('示例·', '')} 👋 (示例自动回复)`)
    toast(`${u.name} 接受了你的招呼,去聊聊吧`, 'ok')
  }, 3000)
}

export function ReportSheet({ open, onClose, uid: id, name }: { open: boolean; onClose: () => void; uid: string; name: string }) {
  const [r, setR] = useState('')
  return (
    <Sheet open={open} onClose={onClose} title={`举报 ${name}`}>
      <div className="chips col">{REPORT_REASONS.map((x) => <Chip key={x} on={r === x} onClick={() => setR(x)}>{x}</Chip>)}</div>
      <p className="tiny">聊天内容不存服务器,如需提供聊天证据,请主动提交片段。举报进入后台队列,目标 24 小时内处理。</p>
      <Btn block onClick={() => { if (!r) { bad(); return toast('请先选一个举报原因', 'warn') } set((s) => ({ reported: [...s.reported, id] })); setR(''); onClose(); toast('已收到举报,谢谢你(示例:不会真的发送)', 'ok') }}>提交举报</Btn>
    </Sheet>
  )
}
export function UserMenu({ open, onClose, id, name }: { open: boolean; onClose: () => void; id: string; name: string }) {
  const [rep, setRep] = useState(false), [conf, setConf] = useState(false)
  return (<>
    <Sheet open={open} onClose={onClose}>
      <button className="menuitem" onClick={() => { onClose(); setTimeout(() => setRep(true), 230) }}>🚩 举报 {name}</button>
      <button className="menuitem danger" onClick={() => { onClose(); setTimeout(() => setConf(true), 230) }}>🚫 拉黑 {name}</button>
      <button className="menuitem" onClick={onClose}>取消</button>
    </Sheet>
    <ReportSheet open={rep} onClose={() => setRep(false)} uid={id} name={name} />
    <Modal open={conf} onClose={() => setConf(false)} title={`拉黑 ${name}?`}>
      <p className="muted">拉黑后对方不会再出现在你的推荐、广场和消息里,已有好友关系也会解除。可在 设置 → 黑名单 里恢复。</p>
      <Btn block kind="danger" onClick={() => { block(id); setConf(false); toast('已拉黑', 'ok'); if (location.hash.includes(id)) nav('/discover') }}>确认拉黑</Btn>
      <Btn block kind="ghost" onClick={() => setConf(false)}>取消</Btn>
    </Modal>
  </>)
}

export function Discover() {
  const s = useStore(), loading = useLoading(700)
  const [tab, setTab] = useState<'rec' | 'same' | 'near'>('rec')
  const [menu, setMenu] = useState<FakeUser | null>(null)
  const [tour, setTour] = useState(!seen('tour'))
  const all = matches(s), p = s.profile as Profile
  const list = all.filter((m) => (tab === 'rec' ? true : tab === 'same' ? m.km === 0 : m.km > 0))
  return (
    <div className="page withnav">
      <TopBar title="发现" right={<button className="iconbtn" aria-label="好友" onClick={() => nav('/friends')}>👥</button>} />
      <div className="tabs">{([['rec', '推荐'], ['same', '同城'], ['near', '邻近']] as const).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { haptic(8); setTab(k) }}>{l}</button>)}</div>
      {s.invisible && <div className="banner warn">你已开启隐身:不会出现在别人的推荐里。可在 设置 关闭。</div>}
      <p className="muted pad">以你所在的 {cityName(p.cityId)}(同城 + 100km 内邻近城市)为准,只显示<b>双方性取向、年龄范围都满足</b>的示例用户。</p>
      {loading ? <Skeleton rows={4} card /> : (
        <div className="cards">
          {list.map(({ u, km }, i) => (
            <article key={u.id} className="card ucard" style={{ animationDelay: i * 60 + 'ms' }}>
              <button className="more" aria-label="更多" onClick={() => setMenu(u)}>···</button>
              <button className="ubody" onClick={() => nav('/user/' + u.id)}>
                <Avatar name={u.name} size={64} verified={u.verified} hue={u.hue} />
                <div className="uinfo">
                  <div className="nm">{u.name} <Demo /></div>
                  <div className="meta">{u.age} 岁 · {cityName(u.cityId)}{km ? ` · 邻近 ${km}km` : ' · 同城'} {u.verified && <VerifiedTag />}</div>
                  <div className="tags">{u.interests.slice(0, 2).map((t) => <span key={t}>{t}</span>)}</div>
                </div>
              </button>
              <Btn block small kind={s.friends.includes(u.id) ? 'soft' : 'primary'} onClick={() => greetUser(u, s)}>{s.friends.includes(u.id) ? '去聊天' : s.reqOut.includes(u.id) ? '已打招呼' : '打招呼 👋'}</Btn>
            </article>
          ))}
          {!list.length && <div className="empty"><div className="big">🔍</div>这里暂时没有符合条件的示例用户。<br />试试在 我的 → 编辑资料 里放宽年龄范围,或换到别的 Tab。</div>}
        </div>
      )}
      {menu && <UserMenu open onClose={() => setMenu(null)} id={menu.id} name={menu.name} />}
      <Modal open={tour} onClose={() => { setTour(false); markSeen('tour') }} title="3 步上手">
        <ol className="rules"><li>在 <b>发现</b> 看双向匹配的人,点 <b>打招呼</b>。</li><li>去 <b>派对广场</b> 每天发 10 条找人聊天。</li><li>去 <b>我的</b> 放 9 张照片、做真人认证拿徽章。</li></ol>
        <Btn block onClick={() => { setTour(false); markSeen('tour') }}>开始</Btn>
      </Modal>
    </div>
  )
}

export function Square() {
  const s = useStore(), loading = useLoading(600)
  const [text, setText] = useState(''), [menu, setMenu] = useState<{ id: string; name: string } | null>(null)
  const [tip, setTip] = useState(!seen('square')), [shake, setShake] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const u = used(s, 'square'), left = Math.max(0, 10 - u), n = count(text), over = n > 100
  const [now] = useState(Date.now())
  useEffect(() => { /* 原型:挂载时清理过期(>24h)的自己的广场消息 */
    set((st) => ({ squarePosts: st.squarePosts.filter((x) => Date.now() - x.ts < 864e5) }))
  }, [])
  const post = () => {
    const fail = (m: string) => { bad(); toast(m, 'warn'); setShake(true); setTimeout(() => setShake(false), 400) }
    if (left <= 0) return fail('今天的 10 条已经用完啦,明天再来。用好每一句,找到想聊的人。')
    if (!n) return fail('先写点什么吧,100 字以内。')
    if (over) return fail(`超出 ${n - 100} 个字了。每条最多 100 字,精简一下会更吸引人。`)
    set((st) => ({ squarePosts: [{ id: uid(), text: text.trim(), ts: Date.now() }, ...st.squarePosts] })); bump('square')
    setText(''); toast(`已发布!今天还剩 ${left - 1} 条。24 小时后消失。`, 'ok')
  }
  const mine = s.squarePosts.map((x) => ({ id: x.id, uid: 'me', text: x.text, ts: x.ts }))
  const others = SQUARE_SEED.filter((x) => !s.blocked.includes(x.uid)).map((x) => ({ id: x.id, uid: x.uid, text: x.text, ts: now - x.ageH * 3600e3 }))
  const feed = [...mine, ...others].sort((a, b) => b.ts - a.ts)
  return (
    <div className="page withnav">
      <TopBar title="派对广场" right={<button className="iconbtn" aria-label="规则" onClick={() => setTip(true)}>ⓘ</button>} />
      <div className={'quota sticky' + (left === 0 ? ' zero' : '')}><span>今日剩余 <b>{left}/10</b> 条</span><span className="bar"><i style={{ width: left * 10 + '%' }} /></span></div>
      <div className={'composer card' + (shake ? ' shake' : '')}>
        <textarea ref={ref} rows={3} value={text} placeholder="想找什么样的人聊天?100 字以内…" onChange={(e) => setText(e.target.value)} onFocus={() => { if (!seen('square')) setTip(true) }} />
        <div className="crow"><span className={'ctr' + (over ? ' over' : '')}>{n}/100</span><Btn small onClick={post}>发布 · 剩 {left}</Btn></div>
      </div>
      <p className="tiny pad">每天 10 条、每条 100 字,内容 24 小时后消失。</p>
      {loading ? <Skeleton rows={4} card /> : (
        <div className="cards">{feed.map((x, i) => {
          const fu = USERS.find((y) => y.id === x.uid), isMe = x.uid === 'me', name = isMe ? s.profile!.nickname : fu!.name
          const hl = Math.max(1, Math.ceil(24 - (Date.now() - x.ts) / 3600e3))
          return (
            <article key={x.id} className="card post" style={{ animationDelay: Math.min(i, 8) * 40 + 'ms' }}>
              <div className="phead"><Avatar name={name} size={40} verified={isMe ? s.verify === 'verified' : fu!.verified} hue={fu?.hue} />
                <div className="grow"><div className="nm">{name} {!isMe && <Demo />}</div><div className="meta">{isMe ? '我' : cityName(fu!.cityId)} · {timeAgo(x.ts)} · 还剩 {hl} 小时消失</div></div>
                {!isMe && <button className="more" aria-label="更多" onClick={() => setMenu({ id: fu!.id, name })}>···</button>}</div>
              <p>{x.text}</p>
              {!isMe && fu && <Btn small kind="soft" onClick={() => greetUser(fu, s)}>{s.friends.includes(fu.id) ? '去聊天' : s.reqOut.includes(fu.id) ? '已打招呼' : '打招呼 👋'}</Btn>}
            </article>)
        })}</div>
      )}
      {menu && <UserMenu open onClose={() => setMenu(null)} id={menu.id} name={menu.name} />}
      <Modal open={tip} onClose={() => { setTip(false); markSeen('square') }} title="派对广场规则">
        <p>派对广场每天 <b>10 条</b>、每条 <b>100 字</b>。今天还剩 <b>{left}</b> 条。用好每一句,找到想聊的人。内容 <b>24 小时后消失</b>。</p>
        <p className="tiny">限制数量是为了提升内容质量。禁止裸露、涉及未成年人或违法内容。</p>
        <Btn block onClick={() => { setTip(false); markSeen('square'); setTimeout(() => ref.current?.focus(), 250) }}>知道了,开始发言</Btn>
      </Modal>
    </div>
  )
}
export { sendMsg }
