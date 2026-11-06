import { z } from 'zod'
import { createSession, verifyPassword } from '../../utils/auth'
import { logLogin } from '../../utils/supa-log'
import { supabaseAppDbEnabled } from '../../utils/supa-appdb'
import { ensureAdminExists } from '../../utils/supabase'
import {
  LOGIN_LOCKED_MESSAGE,
  LOGIN_MAX_FAILS,
  clearLoginFailures,
  findUserByUsername,
  isLoginLocked,
  recordLoginFailure
} from '../../utils/account-security'

const BodySchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  remember: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  const body = BodySchema.parse(await readBody(event))

  if (supabaseAppDbEnabled()) {
    const cfg = useRuntimeConfig()
    if (!String(cfg.supabaseServiceRoleKey || '')) {
      throw createError({ statusCode: 500, statusMessage: 'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.' })
    }
  }

  // 아이디는 대소문자 구분 없이 찾는다(비밀번호는 구분).
  let user = await findUserByUsername<any>(body.username)
  // 서버리스 배포에서 Nitro plugin이 실행되지 않는 케이스 대비: admin은 로그인 시점에 없으면 생성
  if (!user && supabaseAppDbEnabled() && body.username.toLowerCase() === 'admin') {
    await ensureAdminExists()
    user = await findUserByUsername<any>(body.username)
  }
  if (!user) {
    await logLogin(event, { userId: null, username: body.username, area: 'main', success: false })
    throw createError({ statusCode: 404, statusMessage: '아이디가 존재하지 않습니다.' })
  }

  // 비밀번호 5회 연속 오류로 잠긴 계정: 비밀번호가 맞아도 들어갈 수 없다(관리자가 비밀번호를 초기화하면 풀림).
  if (isLoginLocked(user)) {
    await logLogin(event, { userId: Number(user.id), username: String(user.username), area: 'main', success: false })
    throw createError({ statusCode: 423, statusMessage: LOGIN_LOCKED_MESSAGE, data: { locked: true } })
  }

  if (!verifyPassword(body.password, String(user.password_hash))) {
    await logLogin(event, { userId: Number(user.id), username: String(user.username), area: 'main', success: false })
    const { count, locked } = await recordLoginFailure(event, user)
    if (locked) {
      throw createError({ statusCode: 423, statusMessage: LOGIN_LOCKED_MESSAGE, data: { locked: true } })
    }
    const suffix = count > 0 ? ` (${count}/${LOGIN_MAX_FAILS}회, ${LOGIN_MAX_FAILS}회 틀리면 접속이 제한됩니다)` : ''
    throw createError({ statusCode: 401, statusMessage: `비밀번호가 올바르지 않습니다.${suffix}` })
  }

  await clearLoginFailures(user)
  // 가입 승인상태(ADMIN > 회원목록): 대기 = "가입승인 대기중입니다." 팝업, 거절 = 로그인 없이 홈페이지 첫 화면으로
  const approval = String(user.approval_status || 'approved')
  if (String(user.role || 'user') === 'user' && approval !== 'approved') {
    await logLogin(event, { userId: Number(user.id), username: String(user.username), area: 'main', success: false })
    if (approval === 'rejected') throw createError({ statusCode: 403, statusMessage: '', data: { rejected: true } })
    throw createError({ statusCode: 403, statusMessage: '가입승인 대기중입니다.', data: { pending: true } })
  }
  await createSession(event, Number(user.id), body.remember)
  await logLogin(event, { userId: Number(user.id), username: String(user.username), area: 'main', success: true })
  return { ok: true }
})
