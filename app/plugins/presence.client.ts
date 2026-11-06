// 로그인한 회원이 "지금 홈페이지를 화면에 띄워 둔 상태"인지, 그리고 어느 화면(차트라면 어떤 종목)을 보고 있는지
// 서버에 알린다(관리자 "실시간 접속"에 표시). 화면을 옮길 때 바로, 같은 화면에 머무는 동안은 20초마다 보낸다.
// 다른 탭이나 다른 창을 보고 있어도(거래소 탭이 열려 있기만 하면) 계속 신호를 보내 접속 중으로 남는다.
// 거래소 탭/창을 닫으면 그 즉시 "접속 종료"를 보내 접속 목록에서 바로 빠진다.
// (숨겨진 탭은 브라우저가 타이머를 1분에 한 번 정도로 늦추므로, 관리자 쪽은 최근 90초 안의 신호를 접속 중으로 본다.)
const HEARTBEAT_MS = 20000
const IMPERSONATE_KEY = 'impersonate_session_token'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const { me } = useMe()
  let lastPath = ''
  let lastAt = 0

  function impersonating() {
    // 관리자가 "다른 계정으로 로그인" 창을 연 경우에는 그 회원이 접속한 것처럼 기록하지 않는다.
    try {
      return !!sessionStorage.getItem(IMPERSONATE_KEY)
    } catch {
      return false
    }
  }

  function beat(force = false) {
    if (!me.value || impersonating()) return
    const path = router.currentRoute.value.path
    const now = Date.now()
    if (!force && path === lastPath && now - lastAt < HEARTBEAT_MS - 1000) return
    lastPath = path
    lastAt = now
    $fetch('/api/presence', { method: 'POST', body: { path } }).catch(() => {})
  }

  // 탭/창을 닫을 때는 기다리지 않고 바로 "접속 종료"를 알린다(sendBeacon은 닫히는 중에도 전송된다).
  function leave() {
    if (!me.value || impersonating()) return
    lastPath = ''
    try {
      navigator.sendBeacon('/api/presence', new Blob([JSON.stringify({ leave: true })], { type: 'application/json' }))
    } catch {
      // ignore
    }
  }

  router.afterEach(() => beat(true))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') beat(true)
  })
  window.addEventListener('pagehide', leave)
  setInterval(() => beat(false), HEARTBEAT_MS)
  setTimeout(() => beat(true), 2500)
})
