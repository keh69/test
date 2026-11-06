import { getSessionUser } from '../../utils/auth'
import { countUnreadMessages, inboxRecipientIdsFor } from '../../utils/messages'

export default defineEventHandler(async (event) => {
  // 세션 캐시를 쓰지 않고 매번 확인한다: 관리자가 차단(승인상태 거절)하면 다음 확인(5초 안)에 401 → 회원 화면 로그아웃
  const user = await getSessionUser(event, { fresh: true })
  if (!user) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다.' })
  return { unread: await countUnreadMessages(await inboxRecipientIdsFor(user)) }
})
