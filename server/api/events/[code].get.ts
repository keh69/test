import { getSessionUser } from '../../utils/auth'
import { fillRankingToSize, getSiteEvent, isRunningHere, maskUsername } from '../../utils/events'
import { DOW_KO, EVENT_KINDS, eventCycleRange, eventRank, isEventKind, prizesForMember, settleDueEventsThrottled } from '../../utils/event-engine'

// 이벤트 상세 + 이번 회차(또는 지난 회차) 순위. 회원 화면이라 다른 회원 아이디는 가려서 보낸다.
// 순위 기준은 이벤트 종류(거래량/거래횟수/배팅왕/수익왕/수익률왕/승리왕)에 따라 다르고, 점수는 volume 칸에 담아 보낸다.
export default defineEventHandler(async (event) => {
  const code = String(getRouterParam(event, 'code') || '')
  const ev: any = await getSiteEvent(code)
  if (!ev || !isRunningHere(ev)) throw createError({ statusCode: 404, statusMessage: '진행 중인 이벤트가 아닙니다.' })
  await settleDueEventsThrottled()
  const week = String(getQuery(event).week || '') === 'last' ? -1 : 0
  const { from, to } = eventCycleRange(ev, week)
  const kind = isEventKind(ev.kind) ? ev.kind : 'weekly_volume'
  const meta = EVENT_KINDS[kind]
  const me = await getSessionUser(event).catch(() => null)
  const round = (v: number) => (meta.decimals === 0 ? Math.round(v) : v)

  // 회원 화면 순위표는 1~100위(한 페이지 10위씩)
  const rows = await eventRank(kind, from, to, 100)
  const real = rows.map((r) => ({
    rank: r.rank,
    name: me && Number(me.id) === r.userId ? r.username : maskUsername(r.username),
    isMe: !!me && Number(me.id) === r.userId,
    volume: r.score,
    trades: r.trades
  }))
  // 실제 회원 아래 빈자리를 임의 참가자로 채워 100위까지 보여 준다(1·2·3위와 실제 회원 순위는 그대로).
  const ranking = fillRankingToSize(real, `${ev.site}:${ev.code}:${from.toISOString()}`, 100).map((r) => ({ ...r, volume: round(r.volume) }))
  let mine: any = null
  if (me) {
    const m = (await eventRank(kind, from, to, 1, Number(me.id)))[0]
    mine = m ? { rank: m.rank, volume: m.score, trades: m.trades } : { rank: null, volume: 0, trades: 0 }
  }
  return {
    event: {
      code: ev.code,
      name: ev.name,
      kind,
      title: ev.title,
      description: ev.description,
      nameEn: ev.name_en || '',
      titleEn: ev.title_en || '',
      descriptionEn: ev.description_en || '',
      prizes: prizesForMember(ev.prizes || []),
      closeDow: Number(ev.close_dow) || 0,
      closeTime: String(ev.close_time || '00:00')
    },
    // 순위 점수 이름/단위(거래량 USDT, 거래횟수 회, 수익률 % 등)
    metric: { ko: meta.scoreKo, en: meta.scoreEn, unit: meta.unit, decimals: meta.decimals, kindKo: meta.ko, kindEn: meta.en },
    closeLabel: { ko: `매주 ${DOW_KO[Number(ev.close_dow) || 0]}요일 ${String(ev.close_time || '00:00')}`, dow: Number(ev.close_dow) || 0, time: String(ev.close_time || '00:00') },
    period: { from: from.toISOString(), to: to.toISOString(), week: week === -1 ? 'last' : 'this' },
    ranking,
    mine,
    loggedIn: !!me
  }
})
