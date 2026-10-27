import { useState } from 'react'
import { Btn, Chip, Modal, TopBar, back, nav, toast, bad, ok } from './ui'
import { COUNTRIES, CITIES, ORIENTS, INTERESTS, PREFS, VIS_LABEL, VIS_ORDER, Gender, Vis, ageOf, deriveTargets } from './data'
import { Profile, seedDemo, set, get } from './store'

export function RulesCard({ onAgree, onClose, open }: { onAgree: () => void; onClose: () => void; open: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title="先看一眼本站规则">
      <ul className="rules">
        <li><b>仅限 18 岁以上。</b>点击"同意"即表示你已年满 18 岁。</li>
        <li><b>限量即质量:</b>最多 9 张照片 + 3 个 ≤60 秒视频;每天 3 篇 ≤200 字博客;派对广场每天 10 条、每条 ≤100 字。</li>
        <li><b>聊天不存服务器:</b>私聊内容加密传输,只保存在你和对方的手机里。聊天不限条数。换机/卸载会丢失,请自行备份。</li>
        <li><b>我们只保存:</b>账号信息、好友关系、你的资料和公开发布的内容。不保存聊天内容。</li>
        <li><b>禁止</b>裸露、涉及未成年人或违法内容,违规内容会被删除,账号可能被封。</li>
      </ul>
      <Btn block onClick={onAgree}>我已年满 18 岁,同意</Btn>
      <Btn block kind="ghost" onClick={onClose}>再想想</Btn>
    </Modal>
  )
}

export function Welcome() {
  return (
    <div className="page hero">
      <div className="logo">派</div>
      <h2>派对 · 限量交友</h2>
      <p className="muted">限量发内容、私聊不上服务器的中文交友站。无需实名,仅限 18+。</p>
      <ul className="pills"><li>9 图 + 3 视频</li><li>每天 3 篇博客</li><li>聊天只在你手机</li><li>真人认证徽章</li></ul>
      <Btn block onClick={() => nav('/register')}>注册新账号</Btn>
      <Btn block kind="soft" onClick={() => nav('/login')}>登录</Btn>
      <Btn block kind="ghost" onClick={() => { seedDemo('demo@example.com'); toast('已进入示例账号(全部为虚构数据)', 'ok'); nav('/discover') }}>一键体验示例账号 →</Btn>
      <p className="tiny">仅限 18 岁以上 · 这是原型演示,不会发送或保存任何真实数据到服务器</p>
    </div>
  )
}

export function Login() {
  const [email, setEmail] = useState(''), [pw, setPw] = useState('')
  const go = () => {
    if (!/.+@.+\..+/.test(email)) { bad(); return toast('请输入有效的邮箱,例如 demo@example.com', 'warn') }
    if (pw.length < 1) { bad(); return toast('请输入密码(原型里随便填)', 'warn') }
    const s = get()
    if (s.profile) { set(() => ({ loggedIn: true, email })); toast('欢迎回来', 'ok'); nav('/discover') }
    else { set(() => ({ loggedIn: true, email })); nav('/setup') }
  }
  return (
    <div className="page">
      <TopBar title="登录" onBack={() => back('/')} />
      <div className="form">
        <label>邮箱<input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@example.com" /></label>
        <label>密码<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="原型里随便填" /></label>
        <Btn block onClick={go}>登录</Btn>
        <p className="tiny">原型演示:不会校验密码,也不会发送到任何服务器。</p>
      </div>
    </div>
  )
}

export function Register() {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [age, setAge] = useState(false), [rules, setRules] = useState(false)
  const next = () => {
    if (!/.+@.+\..+/.test(email)) { bad(); return toast('请输入有效的邮箱', 'warn') }
    if (pw.length < 8) { bad(); return toast('密码至少 8 位', 'warn') }
    if (!age) { bad(); return toast('请先勾选"我已年满 18 岁"。本站仅限 18 岁以上用户。', 'warn') }
    setRules(true)
  }
  return (
    <div className="page">
      <TopBar title="注册" onBack={() => back('/')} />
      <div className="form">
        <div className="steps"><i className="on" /><i /><i /><i /><i /></div>
        <label>邮箱<input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>密码(至少 8 位)<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /><span className="box" />我已年满 18 岁,并已阅读规则</label>
        <p className="tiny privacy">我们只保存:账号信息、好友关系、你的资料和公开发布的内容。不保存聊天内容。</p>
        <Btn block onClick={next}>下一步</Btn>
      </div>
      <p className="fixednote">仅限 18+</p>
      <RulesCard open={rules} onClose={() => setRules(false)} onAgree={() => { setRules(false); set(() => ({ loggedIn: true, email })); ok(); nav('/setup') }} />
    </div>
  )
}

export function Setup() {
  const ex = get().profile, editing = !!ex
  const [step, setStep] = useState(0)
  const [gender, setGender] = useState<Gender | ''>(ex?.gender ?? ''), [birthday, setBirthday] = useState(ex?.birthday ?? ''), [nick, setNick] = useState(ex?.nickname ?? '')
  const [country, setCountry] = useState(ex?.country ?? ''), [cityId, setCityId] = useState(ex?.cityId ?? ''), [q, setQ] = useState('')
  const [orient, setOrient] = useState<string[]>(ex?.orient ?? []), [tg, setTg] = useState<Gender[]>(ex?.targetGenders ?? []), [amin, setAmin] = useState(ex?.ageMin ?? 25), [amax, setAmax] = useState(ex?.ageMax ?? 38)
  const [ints, setInts] = useState<string[]>(ex?.interests ?? []), [prefs, setPrefs] = useState<Record<string, Vis>>(ex?.prefs ?? {})
  const tog = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const cities = CITIES.filter((c) => c.country === country && c.name.toLowerCase().includes(q.toLowerCase()))
  const warn = (m: string) => { bad(); toast(m, 'warn'); return false }
  const check = (): boolean => {
    if (step === 0) {
      if (!nick.trim()) return warn('给自己起个昵称吧(不用真名)')
      if (!gender) return warn('请选择性别,双向匹配需要它')
      if (!birthday) return warn('请填写生日(只显示年龄)')
      if (ageOf(birthday) < 18) return warn('本站仅限 18 岁以上用户')
    }
    if (step === 1 && (!country || !cityId)) return warn('国家和城市都是必填项,用于推荐同城/邻近的人')
    if (step === 2) {
      if (!orient.length) return warn('请至少选择一项性取向(可多选)')
      if (!tg.length) return warn('请至少选择一个目标性别')
      if (amin > amax) return warn('年龄范围的最小值不能大于最大值')
    }
    return true
  }
  const pickOrient = (o: string) => { const n = tog(orient, o); setOrient(n); if (gender) setTg(deriveTargets(gender, n)) }
  const finish = () => {
    if (!check()) return
    const p: Profile = { nickname: nick.trim(), gender: gender as Gender, birthday, country, cityId, orient, targetGenders: tg, ageMin: amin, ageMax: amax, interests: ints, prefs, bio: '' }
    if (editing) { set(() => ({ profile: p })); ok(); toast('资料已更新', 'ok'); nav('/me'); return }
    seedDemo(get().email || 'new@example.com', p)
    set(() => ({ friends: [], reqIn: [], chats: {} }))
    ok(); toast('资料已保存,欢迎来到派对 🎉', 'ok'); nav('/discover')
  }
  const nextStep = () => { if (check()) { setStep(step + 1) } }
  return (
    <div className="page">
      <TopBar title={(editing ? '编辑资料 · ' : '') + ['基本信息', '你在哪里', '你想找谁', '兴趣与偏好'][step]} onBack={step ? () => setStep(step - 1) : editing ? () => back('/me') : undefined} />
      <div className="form">
        <div className="steps">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
        <div key={step} className="stepbody">
          {step === 0 && <>
            <label>昵称(不用真名)<input value={nick} maxLength={12} onChange={(e) => setNick(e.target.value)} placeholder="例如:小满" /></label>
            <div className="field"><span>性别</span><div className="chips">{(['男', '女', '非二元'] as Gender[]).map((g) => <Chip key={g} on={gender === g} onClick={() => { setGender(g); setTg(deriveTargets(g, orient)) }}>{g}</Chip>)}</div></div>
            <label>生日(只显示年龄)<input type="date" value={birthday} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthday(e.target.value)} /></label>
            <p className="tiny">头像:原型里自动用昵称生成渐变头像。真实版会自动扫描上传的头像。</p>
          </>}
          {step === 1 && <>
            <div className="field"><span>国家(必填)</span><div className="chips">{COUNTRIES.map((c) => <Chip key={c} on={country === c} onClick={() => { setCountry(c); setCityId(''); setQ('') }}>{c}</Chip>)}</div></div>
            {country && <div className="field"><span>城市(必填)</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索城市…" />
              <div className="citylist">{cities.map((c) => <button key={c.id} className={'cityitem' + (cityId === c.id ? ' on' : '')} onClick={() => { setCityId(c.id); haptic() }}>{c.name}{cityId === c.id && <b>✓</b>}</button>)}
                {!cities.length && <p className="muted pad">没有匹配的城市(真实版会吸附到最近的城市)</p>}</div></div>}
            <p className="tiny">只保存城市,不保存精确位置。</p>
          </>}
          {step === 2 && <>
            <div className="field"><span>性取向(可多选)</span><div className="chips">{ORIENTS.map((o) => <Chip key={o} on={orient.includes(o)} onClick={() => pickOrient(o)}>{o}</Chip>)}</div></div>
            <div className="field"><span>目标性别(由性取向推导,可手改)</span><div className="chips">{(['男', '女', '非二元'] as Gender[]).map((g) => <Chip key={g} on={tg.includes(g)} onClick={() => setTg(tog(tg, g))}>{g}</Chip>)}</div></div>
            <div className="field"><span>期望对象年龄:{amin} – {amax} 岁</span>
              <div className="range"><input type="range" min={18} max={70} value={amin} onChange={(e) => setAmin(+e.target.value)} aria-label="最小年龄" /><input type="range" min={18} max={70} value={amax} onChange={(e) => setAmax(+e.target.value)} aria-label="最大年龄" /></div></div>
          </>}
          {step === 3 && <>
            <div className="field"><span>兴趣标签(可多选)</span><div className="chips">{INTERESTS.map((o) => <Chip key={o} on={ints.includes(o)} onClick={() => setInts(tog(ints, o))}>{o}</Chip>)}</div></div>
            <div className="field"><span>偏好(示例选项,清单由站长定)</span>
              <div className="prefs">{PREFS.map((o) => { const v = prefs[o]; return (
                <div key={o} className="prefrow"><Chip on={!!v} onClick={() => { const n = { ...prefs }; if (v) delete n[o]; else n[o] = 'self'; setPrefs(n) }}>{o}</Chip>
                  {v && <button className="vis" onClick={() => { haptic(); setPrefs({ ...prefs, [o]: VIS_ORDER[(VIS_ORDER.indexOf(v) + 1) % 4] }) }}>{VIS_LABEL[v]} ⟳</button>}</div>) })}</div>
              <p className="tiny">这类资料属于敏感信息:每项可单独设置谁能看到,随时可删除;真实版会加密存储。</p></div>
          </>}
        </div>
        {step < 3 ? <Btn block onClick={nextStep}>下一步</Btn> : <Btn block onClick={finish}>完成,去发现</Btn>}
      </div>
    </div>
  )
}
function haptic() { try { navigator.vibrate?.(6) } catch { /* */ } }
