// 全部为虚构示例数据,不含真实照片/真实用户
export type Gender = '男' | '女' | '非二元'
export type Vis = 'self' | 'friends' | 'matches' | 'public'
export const VIS_LABEL: Record<Vis, string> = { self: '仅自己', friends: '仅好友', matches: '仅匹配对象', public: '公开' }
export const VIS_ORDER: Vis[] = ['self', 'friends', 'matches', 'public']

export const COUNTRIES = ['澳大利亚', '新西兰', '加拿大', '美国', '英国', '新加坡']
export type City = { id: string; name: string; country: string }
export const CITIES: City[] = [
  { id: 'perth', name: '珀斯 Perth', country: '澳大利亚' },
  { id: 'fremantle', name: '弗里曼特尔 Fremantle', country: '澳大利亚' },
  { id: 'joondalup', name: '乔恩达卢普 Joondalup', country: '澳大利亚' },
  { id: 'mandurah', name: '曼哲拉 Mandurah', country: '澳大利亚' },
  { id: 'melbourne', name: '墨尔本 Melbourne', country: '澳大利亚' },
  { id: 'geelong', name: '吉朗 Geelong', country: '澳大利亚' },
  { id: 'sydney', name: '悉尼 Sydney', country: '澳大利亚' },
  { id: 'wollongong', name: '卧龙岗 Wollongong', country: '澳大利亚' },
  { id: 'brisbane', name: '布里斯班 Brisbane', country: '澳大利亚' },
  { id: 'goldcoast', name: '黄金海岸 Gold Coast', country: '澳大利亚' },
  { id: 'auckland', name: '奥克兰 Auckland', country: '新西兰' },
  { id: 'wellington', name: '惠灵顿 Wellington', country: '新西兰' },
  { id: 'vancouver', name: '温哥华 Vancouver', country: '加拿大' },
  { id: 'burnaby', name: '本拿比 Burnaby', country: '加拿大' },
  { id: 'toronto', name: '多伦多 Toronto', country: '加拿大' },
  { id: 'la', name: '洛杉矶 Los Angeles', country: '美国' },
  { id: 'longbeach', name: '长滩 Long Beach', country: '美国' },
  { id: 'london', name: '伦敦 London', country: '英国' },
  { id: 'singapore', name: '新加坡 Singapore', country: '新加坡' },
]
// 邻近城市(示例,默认半径 100km,见规格 §4.3)
const PAIRS: [string, string, number][] = [
  ['perth', 'fremantle', 19], ['perth', 'joondalup', 26], ['perth', 'mandurah', 72], ['fremantle', 'mandurah', 54],
  ['fremantle', 'joondalup', 40], ['joondalup', 'mandurah', 95],
  ['melbourne', 'geelong', 75], ['sydney', 'wollongong', 80], ['brisbane', 'goldcoast', 75],
  ['vancouver', 'burnaby', 12], ['la', 'longbeach', 32],
]
export function neighborKm(a: string, b: string): number | null {
  if (a === b) return 0
  for (const [x, y, km] of PAIRS) if ((x === a && y === b) || (x === b && y === a)) return km
  return null
}
export const cityName = (id: string) => CITIES.find((c) => c.id === id)?.name.split(' ')[0] ?? id

export const ORIENTS = ['异性恋', '同性恋', '双性恋', '泛性恋', '其他']
export const INTERESTS = ['旅行', '美食', '咖啡', '健身', '徒步', '电影', '音乐', '摄影', '桌游', '宠物', '读书', '潜水']
// 性爱好选项:示例清单,由站长最终确定(规格 §4.2/§13-4)
export const PREFS = ['浪漫晚餐', '慢热陪伴', '旅行同行', '深夜聊天', '户外探险', '长期关系', '先做朋友', '角色扮演(示例)']

export function deriveTargets(g: Gender, orient: string[]): Gender[] {
  const s = new Set<Gender>()
  const all: Gender[] = ['男', '女', '非二元']
  for (const o of orient) {
    if (o === '异性恋') (g === '男' ? ['女'] : g === '女' ? ['男'] : all).forEach((x) => s.add(x as Gender))
    else if (o === '同性恋') s.add(g)
    else all.forEach((x) => s.add(x))
  }
  return all.filter((x) => s.has(x))
}
export function ageOf(birthday: string): number {
  const b = new Date(birthday), n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--
  return a
}

export type FakeUser = {
  id: string; name: string; gender: Gender; age: number; cityId: string; verified: boolean
  tg: Gender[]; ageMin: number; ageMax: number; invisible?: boolean; interests: string[]; bio: string; hue: number
}
const U = (id: string, name: string, gender: Gender, age: number, cityId: string, verified: boolean, tg: Gender[], ageMin: number, ageMax: number, interests: string[], bio: string, extra: Partial<FakeUser> = {}): FakeUser =>
  ({ id, name: '示例·' + name, gender, age, cityId, verified, tg, ageMin, ageMax, interests, bio, hue: (id.charCodeAt(1) * 47) % 360, ...extra })
export const USERS: FakeUser[] = [
  U('u1', '阿远', '男', 31, 'perth', true, ['女'], 24, 34, ['徒步', '咖啡', '摄影'], '周末喜欢去海边走走。(虚构示例)'),
  U('u2', '小北', '男', 29, 'perth', false, ['女'], 25, 33, ['电影', '美食'], '会做三道拿手菜。(虚构示例)'),
  U('u3', '子墨', '男', 34, 'fremantle', true, ['女'], 26, 38, ['音乐', '咖啡', '读书'], '在码头边弹吉他的人。(虚构示例)'),
  U('u4', '浩然', '男', 27, 'joondalup', false, ['女', '非二元'], 24, 32, ['健身', '桌游'], '想找个一起打球的人。(虚构示例)'),
  U('u5', '林舟', '男', 36, 'mandurah', true, ['女'], 27, 40, ['潜水', '旅行'], '周末出海钓鱼。(虚构示例)'),
  U('u6', '安然', '女', 28, 'perth', true, ['男', '女'], 25, 36, ['旅行', '美食', '宠物'], '养了一只虚构的猫。(虚构示例)'),
  U('u7', '千寻', '女', 26, 'fremantle', false, ['女'], 22, 32, ['摄影', '读书'], '喜欢逛市集。(虚构示例)'),
  U('u8', '老周', '男', 45, 'perth', true, ['女'], 30, 42, ['钓鱼' as string, '咖啡'], '年龄不在你的范围内,不应出现。(虚构示例)'),
  U('u9', '晓风', '男', 30, 'perth', false, ['女'], 20, 24, ['音乐'], '想找比我小的。你的年龄不在他的范围内。(虚构示例)'),
  U('u10', '陈默', '男', 33, 'melbourne', true, ['女'], 25, 38, ['电影'], '在墨尔本,距离太远,不应出现。(虚构示例)'),
  U('u11', '阿杰', '男', 32, 'perth', true, ['女'], 25, 36, ['健身'], '已开启隐身,不应出现。(虚构示例)', { invisible: true }),
  U('u12', '一诺', '男', 28, 'perth', true, ['女'], 24, 32, ['徒步', '潜水', '美食'], '想找个周末一起爬山的人。(虚构示例)'),
  U('u13', '南乔', '非二元', 27, 'perth', false, ['男', '女', '非二元'], 24, 35, ['桌游', '咖啡'], '爱做手作。(虚构示例)'),
  U('u14', '宋晨', '男', 35, 'sydney', false, ['女'], 28, 40, ['美食'], '在悉尼,距离太远。(虚构示例)'),
]
export const DEMO_REQUEST_FROM = 'u3'
export const DEMO_FRIEND = 'u1'
export const SQUARE_SEED: { id: string; uid: string; text: string; ageH: number }[] = [
  { id: 's1', uid: 'u6', text: '今晚有人想去海边吹吹风吗?🌅', ageH: 0.4 },
  { id: 's2', uid: 'u2', text: '新手做饭中,求推荐一道不会翻车的菜。', ageH: 1.5 },
  { id: 's3', uid: 'u12', text: '周六早上想去 Kings Park 走走,有同路的吗?', ageH: 3 },
  { id: 's4', uid: 'u13', text: '最近在学陶艺,有人想一起报名体验课吗?', ageH: 8 },
  { id: 's5', uid: 'u5', text: '出海钓到一条小鱼,放生了。有人爱看海吗?', ageH: 15 },
  { id: 's6', uid: 'u7', text: '想找个能聊书的人,最近在读《小王子》。', ageH: 21.5 },
]
export const BLOG_SEED: { id: string; uid: string; text: string; ageH: number }[] = [
  { id: 'b1', uid: 'u3', text: '今天在码头弹了一首新学的曲子,路过的陌生人给我鼓了掌,心情很好。想把这种小确幸分享给你。(虚构示例)', ageH: 5 },
  { id: 'b2', uid: 'u6', text: '关于约会,我想要的不多:真诚、有趣、能一起安静地待着。(虚构示例)', ageH: 26 },
]
export const REPORT_REASONS = ['色情/裸露内容', '涉及未成年人', '骚扰或辱骂', '诈骗/要钱/拉投资', '冒充他人', '其他']
export const SCAM_RE = /转账|投资|加微信|加我微信|微信号|http|www\.|\.com|汇款|理财/
