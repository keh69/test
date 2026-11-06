import { listSiteEvents } from '../../utils/events'
import { settleDueEventsThrottled } from '../../utils/event-engine'

// 지금 이 사이트(테스트/거래소)에서 진행 중인 이벤트 목록(상단 메뉴용)
export default defineEventHandler(async () => {
  // 마감된 회차가 있으면 상금 지급 + 당첨 쪽지(서버당 1분에 한 번만 확인, 여러 서버가 불러도 한 번만 지급)
  await settleDueEventsThrottled()
  const rows = await listSiteEvents(true).catch(() => [])
  return { items: rows.map((r) => ({ code: r.code, name: r.name, title: r.title, nameEn: r.name_en || '', titleEn: r.title_en || '' })) }
})
