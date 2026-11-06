import { getSupabaseAdminClient } from './supabase'
import { supabaseAppDbEnabled } from './supa-appdb'
import { currentSite } from './site'

export type EventRow = {
  id: number
  site: string
  code: string
  name: string
  kind: string
  title: string
  description: string
  // 영어 화면용(비어 있으면 한국어를 그대로 보여 준다)
  name_en?: string
  title_en?: string
  description_en?: string
  prizes: Array<{ rank: string; reward: string }>
  enabled: boolean
  // 테스트·거래소 공통 이벤트(site='all')의 사이트별 진행 여부
  enabled_test?: boolean
  enabled_ktx?: boolean
}

// 이 사이트에서 진행 중인지: 공통 이벤트(site='all')는 enabled_test / enabled_ktx, 예전 사이트별 행은 enabled
export function isRunningHere(r: EventRow) {
  if (r.site === 'all') return currentSite() === 'test' ? !!r.enabled_test : !!r.enabled_ktx
  return r.site === currentSite() && !!r.enabled
}

// 이번 주(한국시간 월요일 00:00 ~ 다음 월요일 00:00) 구간. offsetWeeks=-1이면 지난주.
export function kstWeekRange(offsetWeeks = 0, nowMs = Date.now()) {
  const KST = 9 * 3600 * 1000
  const k = new Date(nowMs + KST)
  const dow = (k.getUTCDay() + 6) % 7 // 월=0
  const startKst = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() - dow + offsetWeeks * 7)
  const from = new Date(startKst - KST)
  const to = new Date(startKst - KST + 7 * 24 * 3600 * 1000)
  return { from, to }
}

export async function listSiteEvents(onlyEnabled = true): Promise<EventRow[]> {
  if (!supabaseAppDbEnabled()) return []
  const { data } = await getSupabaseAdminClient()
    .from('bitduck_events')
    .select('*')
    .in('site', ['all', currentSite()])
    .order('id', { ascending: true })
  const rows = (data || []) as EventRow[]
  return onlyEnabled ? rows.filter(isRunningHere) : rows
}

export async function getSiteEvent(code: string): Promise<EventRow | null> {
  if (!supabaseAppDbEnabled()) return null
  const { data } = await getSupabaseAdminClient()
    .from('bitduck_events')
    .select('*')
    .in('site', ['all', currentSite()])
    .eq('code', code)
    .order('id', { ascending: true })
  const rows = (data || []) as EventRow[]
  // 공통 이벤트를 먼저, 없으면 예전 사이트별 행
  return rows.find((r) => r.site === 'all') || rows[0] || null
}

export type VolumeRankRow = { rank: number; user_id: number; username: string; volume: number; trades: number }

// 거래량 순위(체결금액 = 진입 + 청산, USDT). userId를 주면 그 회원의 순위만.
export async function weeklyVolumeRank(from: Date, to: Date, limit = 20, userId?: number): Promise<VolumeRankRow[]> {
  if (!supabaseAppDbEnabled()) return []
  const { data, error } = await getSupabaseAdminClient().rpc('bitduck_event_volume_rank', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_limit: limit,
    p_user: userId ?? null
  })
  if (error) throw error
  return ((data || []) as any[]).map((r) => ({
    rank: Number(r.rank),
    user_id: Number(r.user_id),
    username: String(r.username || ''),
    volume: Number(r.volume) || 0,
    trades: Number(r.trades) || 0
  }))
}

// 회원 화면용 아이디 가리기: 앞 2글자만 보이고 나머지는 *
export function maskUsername(u: string) {
  const s = String(u || '')
  if (s.length <= 2) return s.slice(0, 1) + '*'
  return s.slice(0, 2) + '*'.repeat(Math.min(6, s.length - 2))
}

// ── 순위표 빈자리 채우기 ──
// 실제 회원 순위를 먼저 그대로 두고(1·2·3위는 항상 실제 회원), 실제 회원이 100명보다 적으면
// 맨 아래 빈자리를 임의 참가자로 채운다. 임의 참가자의 거래량은 항상 마지막 실제 회원보다 작아서
// 실제 회원의 순위·상금 순위는 바뀌지 않는다. 같은 주(같은 기간)에는 늘 같은 이름·순서로 보인다.
function seededRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashSeed(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
const FILLER_LETTERS = 'abcdefghijkmnoprstuvwxyz'
function fillerUsername(rng: () => number) {
  const letters = 2 + Math.floor(rng() * 5)
  const digits = Math.floor(rng() * 5)
  let s = ''
  for (let i = 0; i < letters; i++) s += FILLER_LETTERS[Math.floor(rng() * FILLER_LETTERS.length)]
  for (let i = 0; i < digits; i++) s += String(Math.floor(rng() * 10))
  return s
}

export type PublicRankRow = { rank: number; name: string; isMe: boolean; volume: number; trades: number }

export function fillRankingToSize(rows: PublicRankRow[], seedKey: string, size = 100): PublicRankRow[] {
  // 실제 회원이 3명 이상일 때만 채운다(1·2·3위는 반드시 실제 회원).
  if (rows.length < 3 || rows.length >= size) return rows
  const rng = seededRng(hashSeed(seedKey))
  const lastReal = rows[rows.length - 1]!
  const ceiling = Math.max(1, Number(lastReal.volume) || 1)
  const need = size - rows.length
  const out = rows.slice()
  // 마지막 실제 회원 거래량의 97% → 약 2%까지, 들쭉날쭉하게 내려간다.
  let ratio = 0.9 + rng() * 0.07
  const step = Math.pow(0.02 / ratio, 1 / Math.max(1, need - 1))
  for (let i = 0; i < need; i++) {
    const v = ceiling * ratio * (0.985 + rng() * 0.03)
    out.push({
      rank: rows.length + i + 1,
      name: maskUsername(fillerUsername(rng)),
      isMe: false,
      volume: Math.round(v * 100) / 100,
      trades: 1 + Math.floor(rng() * 40)
    })
    ratio *= step
  }
  // 위 들쭉날쭉 때문에 순서가 뒤집히지 않게 임의 참가자끼리만 거래량 순으로 다시 정렬
  const fillers = out.slice(rows.length).sort((a, b) => b.volume - a.volume)
  fillers.forEach((f, i) => {
    f.rank = rows.length + i + 1
    f.volume = Math.min(f.volume, ceiling - 0.01 * (i + 1))
  })
  return rows.concat(fillers)
}
