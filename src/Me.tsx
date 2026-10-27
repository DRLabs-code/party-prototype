import { useRef, useState } from 'react'
import { Avatar, Btn, Demo, Modal, Sheet, Skeleton, Switch, TopBar, VerifiedTag, back, bad, count, haptic, nav, ok, timeAgo, toast, useLoading } from './ui'
import { BLOG_SEED, USERS, cityName, ageOf, CITIES } from './data'
import { get, block, bump, markSeen, runtimeVideos, seen, seedDemo, set, uid, unblock, used, useStore, wipe, acceptFriend } from './store'
import { RulesCard } from './Auth'
import { UserMenu, greetUser } from './Discover'

function shrink(file: File, max = 520): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')) }
    img.src = url
  })
}
function probeVideo(file: File): Promise<{ dur: number; poster: string; url: string }> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), v = document.createElement('video')
    v.preload = 'metadata'; v.muted = true; v.playsInline = true; v.src = url
    v.onloadedmetadata = () => {
      const dur = v.duration
      if (!isFinite(dur)) return rej(new Error('bad'))
      if (dur > 60.5) return res({ dur, poster: '', url })
      v.currentTime = Math.min(0.5, dur / 2)
    }
    v.onseeked = () => {
      try { const c = document.createElement('canvas'); c.width = 240; c.height = Math.round(240 * (v.videoHeight / v.videoWidth || 1.33)); c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height); res({ dur: v.duration, poster: c.toDataURL('image/jpeg', 0.6), url }) } catch { res({ dur: v.duration, poster: '', url }) }
    }
    v.onerror = () => rej(new Error('bad'))
  })
}

export function Me() {
  const s = useStore(), loading = useLoading(600), p = s.profile!
  const photoIn = useRef<HTMLInputElement>(null), videoIn = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<string | null>(null), [tip, setTip] = useState(!seen('media'))
  const pLeft = 9 - s.photos.length, vLeft = 3 - s.videos.length
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    const arr = Array.from(files)
    if (arr.length > pLeft) toast(`最多放 9 张照片(已用 ${s.photos.length}/9),多出的 ${arr.length - pLeft} 张没有添加。`, 'warn')
    const add: { id: string; src: string }[] = []
    for (const f of arr.slice(0, pLeft)) { try { add.push({ id: uid(), src: await shrink(f) }) } catch { toast('有一张图片无法读取,已跳过', 'warn') } }
    if (add.length) { set((st) => ({ photos: [...st.photos, ...add] })); toast(`已添加 ${add.length} 张(已用 ${get().photos.length}/9)。仅保存在本机。`, 'ok') }
    if (photoIn.current) photoIn.current.value = ''
  }
  const addVideo = async (files: FileList | null) => {
    const f = files?.[0]; if (!f) return
    try {
      const r = await probeVideo(f)
      if (r.dur > 60.5) { URL.revokeObjectURL(r.url); bad(); return toast(`这个视频 ${Math.round(r.dur)} 秒,超过 60 秒了。太长会自动拒绝,请先剪短。`, 'warn') }
      const id = uid(); runtimeVideos.set(id, r.url)
      set((st) => ({ videos: [...st.videos, { id, name: f.name, dur: Math.round(r.dur), poster: r.poster }] }))
      toast(`视频已添加(已用 ${get().videos.length}/3)。仅保存在本机。`, 'ok')
    } catch { toast('这个视频无法读取,请换一个文件', 'warn') }
    if (videoIn.current) videoIn.current.value = ''
  }
  const tryAddPhoto = () => { if (pLeft <= 0) { bad(); return toast('最多放 9 张照片(已用 9/9)。精选几张最像你的,比堆很多更吸引人。先删掉一张再添加。', 'warn') } photoIn.current?.click() }
  const tryAddVideo = () => { if (vLeft <= 0) { bad(); return toast('最多 3 个视频(已用 3/3)。先删掉一个再添加。', 'warn') } videoIn.current?.click() }
  return (
    <div className="page withnav">
      <TopBar title="我的主页" right={<button className="iconbtn" aria-label="设置" onClick={() => nav('/settings')}>⚙</button>} />
      <section className="me-head">
        <Avatar name={p.nickname} size={88} verified={s.verify === 'verified'} />
        <h2>{p.nickname}</h2>
        <div className="meta">{ageOf(p.birthday)} 岁 · {p.gender} · {p.country} {cityName(p.cityId)}</div>
        {s.verify === 'verified' ? <VerifiedTag /> : <Btn small kind="soft" onClick={() => nav('/verify')}>{s.verify === 'pending' ? '认证审核中…' : '获取"已真人认证"'}</Btn>}
        <div className="tags center">{p.interests.map((t) => <span key={t}>{t}</span>)}</div>
        <div className="row2"><Btn small kind="ghost" onClick={() => nav('/setup')}>编辑资料</Btn><Btn small kind="ghost" onClick={() => nav('/blog')}>我的博客</Btn><Btn small kind="ghost" onClick={() => nav('/friends')}>好友</Btn></div>
      </section>
      {loading ? <Skeleton rows={3} /> : <>
        <section className="card sect">
          <div className="shead"><h3>照片 <span className={'cnt' + (pLeft === 0 ? ' full' : '')}>{s.photos.length}/9</span></h3><Btn small kind={pLeft ? 'primary' : 'soft'} onClick={tryAddPhoto}>{pLeft ? '＋ 添加' : '已满 9/9'}</Btn></div>
          <div className="grid9">{Array.from({ length: 9 }).map((_, i) => s.photos[i]
            ? <button key={s.photos[i].id} className="tile pop" onClick={() => setView(s.photos[i].id)}><img src={s.photos[i].src} alt={`照片 ${i + 1}`} /></button>
            : <button key={i} className="tile empty" onClick={tryAddPhoto} aria-label="添加照片">＋</button>)}</div>
          <p className="tiny">最多放 9 张照片(已用 {s.photos.length}/9)。精选几张最像你的,比堆很多更吸引人。禁止裸露、涉及未成年人或违法内容。图片只存在本机(原型)。</p>
          <input ref={photoIn} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        </section>
        <section className="card sect">
          <div className="shead"><h3>视频 <span className={'cnt' + (vLeft === 0 ? ' full' : '')}>{s.videos.length}/3</span></h3><Btn small kind={vLeft ? 'primary' : 'soft'} onClick={tryAddVideo}>{vLeft ? '＋ 添加' : '已满 3/3'}</Btn></div>
          <div className="vids">{[0, 1, 2].map((i) => { const v = s.videos[i]; return v
            ? <button key={v.id} className="vslot pop" onClick={() => { const u = runtimeVideos.get(v.id); if (u) setView('v:' + v.id); else toast('原型不持久保存视频文件,刷新后只保留封面。', 'info') }}>{v.poster ? <img src={v.poster} alt="视频封面" /> : <span className="grad" />}<span className="play">▶</span><span className="dur">0:{String(v.dur).padStart(2, '0')}</span></button>
            : <button key={i} className="vslot empty" onClick={tryAddVideo} aria-label="添加视频">＋<small>≤60 秒</small></button> })}</div>
          <p className="tiny">最多 3 个视频,每个不超过 60 秒(已用 {s.videos.length}/3)。太长会自动拒绝,请先剪短。</p>
          <input ref={videoIn} type="file" accept="video/*" hidden onChange={(e) => addVideo(e.target.files)} />
        </section>
        <section className="card sect">
          <div className="shead"><h3>博客 <span className="cnt">今天 {used(s, 'blog')}/3</span></h3><Btn small kind="soft" onClick={() => nav('/blog')}>去写 →</Btn></div>
          {s.blogs.slice(0, 2).map((b) => <p key={b.id} className="blogline">{b.text}<small> · {timeAgo(b.ts)}</small></p>)}
          {!s.blogs.length && <p className="muted">还没有博客。每天最多 3 篇,每篇 200 字内。</p>}
        </section>
      </>}
      <Modal open={tip} onClose={() => { setTip(false); markSeen('media') }} title="照片和视频规则">
        <p>最多放 <b>9 张照片</b>和 <b>3 个 ≤60 秒视频</b>。精选几张最像你的,比堆很多更吸引人。</p>
        <p className="tiny">原型:文件只保存在你自己的浏览器里,不会上传。</p>
        <Btn block onClick={() => { setTip(false); markSeen('media') }}>知道了</Btn>
      </Modal>
      <Sheet open={!!view} onClose={() => setView(null)}>
        {view?.startsWith('v:') ? <video src={runtimeVideos.get(view.slice(2))} controls playsInline className="viewer" />
          : <img className="viewer" src={s.photos.find((x) => x.id === view)?.src} alt="大图" />}
        <Btn block kind="danger" onClick={() => { const id = view!; setView(null); if (id.startsWith('v:')) set((st) => ({ videos: st.videos.filter((x) => 'v:' + x.id !== id) })); else set((st) => ({ photos: st.photos.filter((x) => x.id !== id) })); toast('已删除', 'ok') }}>删除</Btn>
      </Sheet>
    </div>
  )
}

export function Blog() {
  const s = useStore(), loading = useLoading(500), [text, setText] = useState(''), [tip, setTip] = useState(!seen('blog')), [shake, setShake] = useState(false)
  const left = Math.max(0, 3 - used(s, 'blog')), n = count(text), over = n > 200, [now] = useState(Date.now())
  const post = () => {
    const fail = (m: string) => { bad(); toast(m, 'warn'); setShake(true); setTimeout(() => setShake(false), 400) }
    if (left <= 0) return fail('今天的 3 篇已经发完了,明天再来。想清楚再发,质量比数量重要。')
    if (!n) return fail('先写点什么吧,200 字以内。')
    if (over) return fail(`超出 ${n - 200} 个字了。每篇最多 200 字,删掉一点吧。`)
    set((st) => ({ blogs: [{ id: uid(), text: text.trim(), ts: Date.now() }, ...st.blogs] })); bump('blog'); setText('')
    toast(`已发布!今天还剩 ${left - 1} 篇。`, 'ok')
  }
  return (
    <div className="page">
      <TopBar title="博客" onBack={() => back('/me')} />
      <div className={'quota' + (left === 0 ? ' zero' : '')}><span>今天还剩 <b>{left}</b> 篇——想清楚再发</span><span className="bar"><i style={{ width: (left / 3) * 100 + '%' }} /></span></div>
      <div className={'composer card' + (shake ? ' shake' : '')}>
        <textarea rows={6} value={text} placeholder="写点今天的心情,200 字以内…" onChange={(e) => setText(e.target.value)} />
        <div className="crow"><span className={'ctr' + (over ? ' over' : '')}>{n}/200</span><Btn small onClick={post}>发布 · 剩 {left}</Btn></div>
      </div>
      <p className="tiny pad">每天最多发 3 篇,每篇 200 字以内。今天还剩 {left} 篇——想清楚再发。</p>
      {loading ? <Skeleton rows={3} card /> : <div className="cards">
        {s.blogs.map((b) => <article key={b.id} className="card post"><div className="meta">我 · {timeAgo(b.ts)}</div><p>{b.text}</p></article>)}
        <h4 className="sub">示例博客</h4>
        {BLOG_SEED.filter((b) => !s.blocked.includes(b.uid)).map((b) => { const u = USERS.find((x) => x.id === b.uid)!; return (
          <article key={b.id} className="card post"><div className="phead"><Avatar name={u.name} size={36} verified={u.verified} hue={u.hue} /><div className="grow"><div className="nm">{u.name} <Demo /></div><div className="meta">{timeAgo(now - b.ageH * 3600e3)}</div></div></div><p>{b.text}</p></article>) })}
      </div>}
      <Modal open={tip} onClose={() => { setTip(false); markSeen('blog') }} title="博客规则">
        <p>每天最多发 <b>3 篇</b>,每篇 <b>200 字</b>以内。今天还剩 <b>{left}</b> 篇——想清楚再发。</p>
        <Btn block onClick={() => { setTip(false); markSeen('blog') }}>知道了</Btn>
      </Modal>
    </div>
  )
}

export function Friends() {
  const s = useStore(), loading = useLoading(450), [menu, setMenu] = useState<{ id: string; name: string } | null>(null)
  const fr = s.friends.map((id) => USERS.find((u) => u.id === id)!).filter(Boolean), rq = s.reqIn.map((id) => USERS.find((u) => u.id === id)!).filter(Boolean)
  return (
    <div className="page">
      <TopBar title="好友列表" onBack={() => back('/me')} />
      {loading ? <Skeleton rows={4} /> : <>
        {rq.length > 0 && <><h4 className="sub">消息请求 · {rq.length}</h4><div className="cards">{rq.map((u) => (
          <div key={u.id} className="card row"><Avatar name={u.name} size={44} verified={u.verified} hue={u.hue} /><div className="grow"><div className="nm">{u.name} <Demo /></div><div className="meta">想和你打招呼</div></div>
            <Btn small onClick={() => { acceptFriend(u.id); toast('已接受,现在可以无限聊天了', 'ok') }}>接受</Btn>
            <Btn small kind="ghost" onClick={() => { set((st) => ({ reqIn: st.reqIn.filter((x) => x !== u.id) })); toast('已忽略') }}>忽略</Btn></div>))}</div></>}
        <h4 className="sub">好友 · {fr.length}</h4>
        <div className="cards">{fr.map((u) => (
          <div key={u.id} className="card row"><button className="rowmain" onClick={() => nav('/user/' + u.id)}><Avatar name={u.name} size={44} verified={u.verified} hue={u.hue} /><div className="grow"><div className="nm">{u.name} <Demo /></div><div className="meta">{cityName(u.cityId)} · {u.age} 岁</div></div></button>
            <Btn small onClick={() => nav('/chat/' + u.id)}>聊天</Btn><button className="more" aria-label="更多" onClick={() => setMenu({ id: u.id, name: u.name })}>···</button></div>))}
          {!fr.length && <div className="empty"><div className="big">👥</div>还没有好友。去 发现 或 派对广场 打个招呼吧。</div>}</div>
      </>}
      {menu && <UserMenu open onClose={() => setMenu(null)} id={menu.id} name={menu.name} />}
    </div>
  )
}

export function UserProfile({ id }: { id: string }) {
  const s = useStore(), loading = useLoading(500), u = USERS.find((x) => x.id === id), [menu, setMenu] = useState(false)
  if (!u) return <div className="page"><TopBar title="用户" onBack={() => back()} /><div className="empty">找不到这个用户</div></div>
  const blogs = BLOG_SEED.filter((b) => b.uid === id), friend = s.friends.includes(id)
  return (
    <div className="page">
      <TopBar title={u.name} onBack={() => back()} right={<button className="iconbtn" aria-label="更多" onClick={() => setMenu(true)}>···</button>} />
      <section className="me-head"><Avatar name={u.name} size={88} verified={u.verified} hue={u.hue} /><h2>{u.name} <Demo /></h2>
        <div className="meta">{u.age} 岁 · {u.gender} · {cityName(u.cityId)}</div>{u.verified && <VerifiedTag />}
        <p className="muted">{u.bio}</p><div className="tags center">{u.interests.map((t) => <span key={t}>{t}</span>)}</div>
        <div className="row2"><Btn onClick={() => greetUser(u, s)}>{friend ? '聊天' : s.reqOut.includes(id) ? '已打招呼' : '加好友 / 打招呼'}</Btn><Btn kind="ghost" onClick={() => setMenu(true)}>举报 / 拉黑</Btn></div></section>
      {loading ? <Skeleton rows={2} /> : <>
        <section className="card sect"><div className="shead"><h3>照片 <span className="cnt">4/9</span></h3></div>
          <div className="grid9">{Array.from({ length: 9 }).map((_, i) => i < 4 ? <span key={i} className="tile ph" style={{ background: `linear-gradient(${40 * i}deg, hsl(${u.hue + i * 30} 70% 78%), hsl(${u.hue + 90 + i * 20} 65% 66%))` }}>示例图</span> : <span key={i} className="tile empty static" />)}</div>
          <p className="tiny">示例占位图,不是真实照片。</p></section>
        <section className="card sect"><div className="shead"><h3>视频 <span className="cnt">1/3</span></h3></div><div className="vids"><span className="vslot ph">▶<span className="dur">0:42</span></span><span className="vslot empty static" /><span className="vslot empty static" /></div></section>
        <section className="card sect"><div className="shead"><h3>博客</h3></div>{blogs.map((b) => <p key={b.id} className="blogline">{b.text}</p>)}{!blogs.length && <p className="muted">暂无博客</p>}</section>
      </>}
      <UserMenu open={menu} onClose={() => setMenu(false)} id={id} name={u.name} />
    </div>
  )
}

export function Verify() {
  const s = useStore()
  const [step, setStep] = useState(s.verify === 'pending' ? 4 : 0), [acts] = useState(() => { const a = ['眨眨眼', '缓慢向左转头', '缓慢向右转头', '念出数字 7 3 9', '微微点头']; return a.sort(() => Math.random() - 0.5).slice(0, 3) })
  const [ai, setAi] = useState(0)
  const run = () => {
    setStep(2); setAi(0)
    ;[1, 2, 3].forEach((n) => setTimeout(() => { setAi(n); haptic(14); if (n === 3) setTimeout(() => { setStep(3); setTimeout(() => { set(() => ({ verify: 'pending' })); setStep(4); ok() }, 1800) }, 600) }, n * 1900))
  }
  return (
    <div className="page">
      <TopBar title="真人认证" onBack={() => back('/me')} />
      <div className="form vcenter">
        {s.verify === 'verified' && <><div className="vhero done"><Avatar name={s.profile!.nickname} size={110} verified /></div><h3>你已通过真人认证 🎉</h3><p className="muted">头像框上会显示"已真人认证",并在推荐中优先展示。</p><Btn block onClick={() => nav('/me')}>回到我的主页</Btn></>}
        {s.verify !== 'verified' && step === 0 && <><div className="vhero"><div className="ring" /><span>🙂</span></div><h3>获取"已真人认证"</h3><ul className="rules"><li>按提示完成 3 个随机动作(眨眼 / 转头 / 念数字)。</li><li>验证视频只用于认证,通过或拒绝后<b>立即删除</b>,只留"已认证"标记。</li><li>自动初筛 + 人工复核,通常 24 小时内出结果。</li></ul><Btn block onClick={() => setStep(1)}>开始</Btn><p className="tiny">原型演示:不会真的打开摄像头,全程为模拟界面。</p></>}
        {step === 1 && <><div className="vhero"><div className="ring" /><span>📷</span></div><h3>需要使用摄像头</h3><p className="muted">真实版会请求浏览器的摄像头权限。这里是模拟,点"允许"继续。</p><Btn block onClick={run}>允许并开始检测</Btn><Btn block kind="ghost" onClick={() => setStep(0)}>返回</Btn></>}
        {step === 2 && <><div className="vhero live"><div className="ring spin" /><span>🙂</span></div><h3>{ai < 3 ? `第 ${ai + 1}/3 步:${acts[ai]}` : '检测完成'}</h3><div className="steps big">{[0, 1, 2].map((i) => <i key={i} className={i < ai ? 'on' : ''} />)}</div><p className="muted">请保持脸部在圆圈内(模拟)</p></>}
        {step === 3 && <><div className="vhero live"><div className="ring spin" /><span>⏫</span></div><h3>正在提交…</h3><p className="muted">视频只用于认证,处理后立即删除</p></>}
        {s.verify === 'pending' && step === 4 && <><div className="vhero"><span>⏳</span></div><h3>已提交,等待人工复核</h3><p className="muted">通常 24 小时内出结果。通过后头像框会出现"已真人认证"。</p>
          <Btn block onClick={() => { set(() => ({ verify: 'verified' })); ok(); toast('审核通过!你的头像已有认证标记', 'ok') }}>演示:模拟审核通过</Btn><Btn block kind="ghost" onClick={() => nav('/me')}>稍后再看</Btn></>}
      </div>
    </div>
  )
}

export function Settings() {
  const s = useStore(), [rules, setRules] = useState(false), [del, setDel] = useState(false)
  const bl = s.blocked.map((id) => USERS.find((u) => u.id === id)!).filter(Boolean)
  const exportChats = () => {
    const blob = new Blob([JSON.stringify({ note: '原型演示:示例聊天备份(未加密)', chats: s.chats }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'chat-backup-demo.json'; a.click(); toast('已导出备份文件(原型为明文;真实版需设口令加密)', 'ok')
  }
  return (
    <div className="page">
      <TopBar title="设置" onBack={() => back('/me')} />
      <div className="list">
        <h4 className="sub">隐私</h4>
        <div className="card srow"><div className="grow"><b>隐身模式</b><small>不进推荐、不显示在线;已有好友仍可聊。</small></div><Switch label="隐身模式" on={s.invisible} onChange={(v) => { set(() => ({ invisible: v })); toast(v ? '已开启隐身:不会出现在别人的推荐里' : '已关闭隐身', 'ok') }} /></div>
        <div className="card srow"><div className="grow"><b>通知</b><small>每日最多 1 条"今日同城新人"摘要(示例)。</small></div><Switch label="通知" on={s.notify} onChange={(v) => set(() => ({ notify: v }))} /></div>
        <h4 className="sub">真人认证</h4>
        <button className="card srow tap" onClick={() => nav('/verify')}><div className="grow"><b>{s.verify === 'verified' ? '已通过真人认证' : s.verify === 'pending' ? '审核中' : '获取"已真人认证"'}</b><small>头像框显示徽章,推荐优先。</small></div><span>›</span></button>
        <h4 className="sub">聊天备份</h4>
        <div className="card"><p className="muted">⚠️ 聊天只存在这台设备上。换手机、清理浏览器数据或卸载,聊天记录会永久丢失。建议在这里导出备份。</p><Btn block kind="soft" onClick={exportChats}>导出聊天备份</Btn></div>
        <h4 className="sub">黑名单</h4>
        <div className="card">{bl.map((u) => <div key={u.id} className="srow"><div className="grow">{u.name}</div><Btn small kind="ghost" onClick={() => { unblock(u.id); toast('已恢复', 'ok') }}>恢复</Btn></div>)}{!bl.length && <p className="muted">没有拉黑的人</p>}</div>
        <h4 className="sub">其他</h4>
        <button className="card srow tap" onClick={() => setRules(true)}><div className="grow"><b>查看本站规则</b></div><span>›</span></button>
        <button className="card srow tap" onClick={() => { set(() => ({ loggedIn: false })); nav('/'); toast('已退出') }}><div className="grow"><b>退出登录</b></div><span>›</span></button>
        <button className="card srow tap danger" onClick={() => setDel(true)}><div className="grow"><b>注销并彻底删除</b><small>删除账号、资料、公开内容和本机聊天,无法恢复。</small></div><span>›</span></button>
        <p className="tiny center">原型 v0.1 · 示例数据 · 城市 {CITIES.length} 个</p>
      </div>
      <RulesCard open={rules} onClose={() => setRules(false)} onAgree={() => setRules(false)} />
      <Modal open={del} onClose={() => setDel(false)} title="确定注销并彻底删除?">
        <p className="muted">账号信息、资料、照片视频、博客、广场内容和本机聊天记录都会被删除,无法恢复。</p>
        <Btn block kind="danger" onClick={() => { setDel(false); wipe(); nav('/', true); toast('账号与数据已全部删除', 'ok') }}>确认注销</Btn>
        <Btn block kind="ghost" onClick={() => setDel(false)}>取消</Btn>
      </Modal>
    </div>
  )
}
export { seedDemo, block }
