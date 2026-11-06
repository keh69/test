// 이벤트 엔진: 종류별 순위, 회차(마감 요일/시각) 계산, 마감 후 상금 지급 + 당첨 쪽지.
// ADMIN / KTX(테스트·거래소) 세 곳이 같은 Supabase를 쓰므로 이 파일은 두 저장소에 똑같이 둔다.
// 지급은 bitduck_event_settlements(이벤트, 회차 끝) 행을 먼저 만든 쪽만 하므로 여러 서버가 동시에 확인해도 한 번만 지급된다.
import { getSupabaseAdminClient } from './supabase'
import { supabaseAppDbEnabled } from './supa-appdb'
import { getOperatorAdminUser, insertMessages, threadKeyForUser } from './messages'

export type EventKind = 'weekly_volume' | 'trade_count' | 'max_bet' | 'profit_sum' | 'best_roe' | 'win_count'

// 순위를 매기는 기준(점수)과 화면 표시용 이름/단위
export const EVENT_KINDS: Record<EventKind, { ko: string; en: string; scoreKo: string; scoreEn: string; unit: string; decimals: number; descKo: string }> = {
  weekly_volume: { ko: '거래량 순위', en: 'Volume ranking', scoreKo: '거래량', scoreEn: 'Volume', unit: 'USDT', decimals: 2, descKo: '회차 동안 체결금액(진입 + 청산) 합계가 많은 순서' },
  trade_count: { ko: '거래횟수 순위', en: 'Trade count ranking', scoreKo: '거래횟수', scoreEn: 'Trades', unit: '회', decimals: 0, descKo: '회차 동안 거래(청산 완료) 횟수가 많은 순서' },
  max_bet: { ko: '배팅왕', en: 'Biggest bet', scoreKo: '최대 배팅', scoreEn: 'Biggest bet', unit: 'USDT', decimals: 2, descKo: '한 번의 거래에 넣은 증거금(배팅금)이 가장 큰 순서' },
  profit_sum: { ko: '수익왕', en: 'Top profit', scoreKo: '실현수익', scoreEn: 'Realized profit', unit: 'USDT', decimals: 2, descKo: '회차 동안 실현수익 합계가 큰 순서(수익이 있는 회원만)' },
  best_roe: { ko: '수익률왕', en: 'Best ROE', scoreKo: '최고 수익률', scoreEn: 'Best ROE', unit: '%', decimals: 2, descKo: '한 번의 거래에서 낸 수익률(ROE)이 가장 높은 순서' },
  win_count: { ko: '승리왕', en: 'Most wins', scoreKo: '수익 거래', scoreEn: 'Winning trades', unit: '회', decimals: 0, descKo: '회차 동안 수익으로 끝난 거래 횟수가 많은 순서' }
}
export function isEventKind(v: any): v is EventKind {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(EVENT_KINDS, v)
}

export const DOW_KO = ['월', '화', '수', '목', '금', '토', '일']

// ── 회차: 매주 close_dow(0=월~6=일) close_time(HH:MM, 한국시간)에 마감. offset 0 = 지금 회차, -1 = 바로 전 회차 ──
export function parseCloseTime(v: any) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || '').trim())
  const h = m ? Math.min(23, Math.max(0, Number(m[1]))) : 0
  const mi = m ? Math.min(59, Math.max(0, Number(m[2]))) : 0
  return h * 60 + mi
}
export function eventCycleRange(ev: { close_dow?: any; close_time?: any }, offset = 0, nowMs = Date.now()) {
  const KST = 9 * 3600 * 1000
  const DAY = 24 * 3600 * 1000
  const dow = Math.min(6, Math.max(0, Number(ev.close_dow) || 0))
  const mins = parseCloseTime(ev.close_time)
  const k = new Date(nowMs + KST)
  const todayDow = (k.getUTCDay() + 6) % 7 // 월=0
  const todayStart = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate())
  let closeKst = todayStart + (dow - todayDow) * DAY + mins * 60 * 1000
  if (closeKst > nowMs + KST) closeKst -= 7 * DAY // 아직 안 온 마감이면 지난주 같은 시각이 "가장 최근 마감"
  const lastClose = closeKst - KST
  const from = lastClose + offset * 7 * DAY
  return { from: new Date(from), to: new Date(from + 7 * DAY) }
}

export type RankRow = { rank: number; userId: number; username: string; score: number; volume: number; trades: number }

export async function eventRank(kind: string, from: Date, to: Date, limit = 100, userId?: number): Promise<RankRow[]> {
  if (!supabaseAppDbEnabled()) return []
  const { data, error } = await getSupabaseAdminClient().rpc('bitduck_event_rank', {
    p_kind: isEventKind(kind) ? kind : 'weekly_volume',
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_limit: limit,
    p_user: userId ?? null
  })
  if (error) throw error
  return ((data || []) as any[]).map((r) => ({
    rank: Number(r.rank),
    userId: Number(r.user_id),
    username: String(r.username || ''),
    score: Number(r.score) || 0,
    volume: Number(r.volume) || 0,
    trades: Number(r.trades) || 0
  }))
}

// ── 상금 표: [{ rank: "1" | "5~10", reward: "5000" }] (USDT) ──
export type PrizeRow = { rank: string; reward: string }
export function prizeRange(rank: string): [number, number] | null {
  const s = String(rank || '')
  const m = s.match(/(\d+)\s*[~\-]\s*(\d+)/)
  if (m) return [Math.min(Number(m[1]), Number(m[2])), Math.max(Number(m[1]), Number(m[2]))]
  const one = s.match(/(\d+)/)
  return one ? [Number(one[1]), Number(one[1])] : null
}
export function prizeAmount(reward: string) {
  const n = Number(String(reward || '').replace(/,/g, '').match(/[\d.]+/)?.[0])
  return Number.isFinite(n) && n > 0 ? n : 0
}
export function prizeFor(prizes: PrizeRow[], rank: number) {
  for (const p of prizes || []) {
    const r = prizeRange(p.rank)
    if (r && rank >= r[0] && rank <= r[1]) return prizeAmount(p.reward)
  }
  return 0
}
export function fmtAmount(n: number) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
}
// 회원 화면용: "1" → "1위", "5000" → "5,000 USDT"
export function prizesForMember(prizes: PrizeRow[]): PrizeRow[] {
  return (prizes || []).map((p) => {
    const r = prizeRange(p.rank)
    const rank = r ? (r[0] === r[1] ? `${r[0]}위` : `${r[0]}~${r[1]}위`) : String(p.rank || '')
    const amt = prizeAmount(p.reward)
    return { rank, reward: amt ? `${fmtAmount(amt)} USDT` : String(p.reward || '') }
  })
}

// ── 당첨 쪽지 ──
export const DEFAULT_WIN_SUBJECT = '[제목] 당첨을 축하드립니다!'
export const DEFAULT_WIN_MESSAGE = `안녕하세요, KTX 거래소 운영팀입니다.

먼저 [제목]에 참여해 주신 회원님께 진심으로 감사의 말씀을 드립니다.
이번 회차 이벤트가 마감되어 최종 순위를 집계한 결과, 회원님께서 [순위]를 기록하시어 당첨되셨습니다. 진심으로 축하드립니다!

■ 이벤트명 : [제목]
■ 최종 순위 : [순위]
■ 당첨금 : [당첨금]

당첨금 [당첨금]은(는) 회원님의 지갑 잔고로 이미 지급이 완료되었습니다.
지갑(보유금액)에서 지급된 금액을 확인해 주시고, 바로 거래에 사용하실 수 있습니다.

이번 회차에 아쉽게 원하시던 순위를 얻지 못하셨더라도 실망하지 마세요.
다음 회차 이벤트는 이미 새롭게 시작되었으며, 이벤트 페이지에서 실시간 순위와 상금을 언제든지 확인하실 수 있습니다.
꾸준한 거래로 다시 한번 상위권에 도전해 보시기 바랍니다.

※ 자전거래 등 비정상적인 거래가 확인되는 경우, 지급된 당첨금은 사전 안내 없이 회수될 수 있습니다.
※ 지급 내역이나 이벤트 관련 문의 사항이 있으시면 언제든지 고객센터로 쪽지를 남겨 주세요.

앞으로도 회원님께 더 많은 혜택과 즐거움을 드릴 수 있도록 노력하겠습니다.
다시 한번 당첨을 축하드리며, 늘 좋은 거래 되시길 바랍니다.

감사합니다.
KTX 거래소 운영팀 드림`

export function renderWinText(template: string, vars: { title: string; rank: number; amount: number }) {
  return String(template || '')
    .replace(/\[제목\]/g, vars.title)
    .replace(/\[순위\]/g, `${vars.rank}위`)
    .replace(/\[당첨금\]/g, `${fmtAmount(vars.amount)} USDT`)
}

export async function getWinMessageTemplate() {
  let subject = ''
  let body = ''
  try {
    const { data } = await getSupabaseAdminClient().from('bitduck_system_settings').select('event_win_subject, event_win_message').eq('id', 1).maybeSingle()
    subject = String((data as any)?.event_win_subject || '')
    body = String((data as any)?.event_win_message || '')
  } catch {}
  return { subject: subject.trim() || DEFAULT_WIN_SUBJECT, body: body.trim() || DEFAULT_WIN_MESSAGE }
}

// ── 마감된 회차 정산(상금 지급 + 쪽지) ──
let lastSettleCheck = 0
// 자주 불리는 곳(이벤트 메뉴 목록 등)에서 부른다. 한 서버에서 1분에 한 번만 실제로 확인한다.
export async function settleDueEventsThrottled() {
  if (Date.now() - lastSettleCheck < 60_000) return
  lastSettleCheck = Date.now()
  await settleDueEvents().catch((e) => console.error('[event-settle]', e?.message || e))
}

export async function settleDueEvents() {
  if (!supabaseAppDbEnabled()) return []
  const supa = getSupabaseAdminClient()
  const { data: events } = await supa.from('bitduck_events').select('*').eq('enabled', true)
  const done: any[] = []
  for (const ev of (events || []) as any[]) {
    const { from, to } = eventCycleRange(ev, -1)
    // 지급 기능을 켠 시점(또는 이벤트를 다시 켠 시점) 이전에 끝난 회차는 지급하지 않는다.
    if (to.getTime() <= new Date(ev.settle_from || 0).getTime()) continue
    const { error: lockErr } = await supa
      .from('bitduck_event_settlements')
      .insert({ event_id: ev.id, period_from: from.toISOString(), period_to: to.toISOString(), status: 'running' })
    if (lockErr) continue // 이미 다른 서버가 정산했거나 정산 중
    const result = await settleOne(ev, from, to).catch((e) => ({ error: String(e?.message || e), winners: 0, total: 0 }))
    await supa
      .from('bitduck_event_settlements')
      .update({ status: (result as any).error ? 'error' : 'done', winners: result.winners, total_amount: result.total, finished_at: new Date().toISOString() })
      .eq('event_id', ev.id)
      .eq('period_to', to.toISOString())
    done.push({ eventId: ev.id, ...result })
  }
  return done
}

async function settleOne(ev: any, from: Date, to: Date) {
  const supa = getSupabaseAdminClient()
  const prizes: PrizeRow[] = Array.isArray(ev.prizes) ? ev.prizes : []
  let maxRank = 0
  for (const p of prizes) {
    const r = prizeRange(p.rank)
    if (r) maxRank = Math.max(maxRank, r[1])
  }
  if (!maxRank) return { winners: 0, total: 0 }
  const rows = await eventRank(ev.kind, from, to, Math.min(1000, maxRank))
  const tpl = await getWinMessageTemplate()
  const operator = await getOperatorAdminUser()
  const title = String(ev.title || ev.name || '이벤트')
  let winners = 0
  let total = 0
  for (const r of rows) {
    const amount = prizeFor(prizes, r.rank)
    if (!(amount > 0)) continue
    // 같은 회원·같은 회차는 한 번만(유일 키)
    const { error: payErr } = await supa.from('bitduck_event_payouts').insert({
      event_id: ev.id,
      period_from: from.toISOString(),
      period_to: to.toISOString(),
      user_id: r.userId,
      username: r.username,
      rank: r.rank,
      score: r.score,
      amount
    })
    if (payErr) continue
    const { error: creditErr } = await supa.rpc('bitduck_event_credit', { p_user: r.userId, p_amount: amount })
    if (creditErr) {
      console.error('[event-settle] credit failed', r.userId, creditErr.message)
      await supa.from('bitduck_event_payouts').delete().eq('event_id', ev.id).eq('period_to', to.toISOString()).eq('user_id', r.userId)
      continue
    }
    winners++
    total += amount
    if (operator) {
      const vars = { title, rank: r.rank, amount }
      try {
        await insertMessages([
          {
            thread_key: threadKeyForUser(r.userId),
            sender_id: Number(operator.id),
            recipient_id: r.userId,
            subject: renderWinText(tpl.subject, vars).slice(0, 100),
            body: renderWinText(tpl.body, vars).slice(0, 5000),
            read_at: null
          } as any
        ])
        await supa.from('bitduck_event_payouts').update({ message_sent: true }).eq('event_id', ev.id).eq('period_to', to.toISOString()).eq('user_id', r.userId)
      } catch (e: any) {
        console.error('[event-settle] message failed', r.userId, e?.message || e)
      }
    }
  }
  return { winners, total }
}
