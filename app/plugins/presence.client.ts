// 로그인한 회원이 거래소를 열어 둔 상태인지, 그리고 어느 화면(차트라면 어떤 종목)을 보고 있는지
// 서버에 알린다(관리자 "실시간 접속"에 표시). 화면을 옮길 때 바로, 같은 화면에 머무는 동안은 20초마다 보낸다.
// - 다른 탭이나 다른 창을 보고 있어도(거래소 탭이 열려 있기만 하면) 계속 신호를 보내 접속 중으로 남는다.
// - 거래소 탭/창을 닫으면 그 즉시 "접속 종료"를 보내 접속 목록에서 바로 빠진다.
// - 크롬 등은 뒤에 숨은 탭의 타이머를 몇 분 뒤부터 1분 이상 간격으로 크게 늦추기 때문에(그래서 몇 분 뒤 접속에서
//   사라졌었다), 20초 신호는 늦춰지지 않는 별도 작업자(Web Worker)가 직접 보낸다. 작업자를 못 쓰는 브라우저만 예전처럼 타이머로 보낸다.
const HEARTBEAT_MS = 20000
const IMPERSONATE_KEY = 'impersonate_session_token'

// 작업자 코드: start(주소/간격) → 간격마다 접속 신호 전송, path → 지금 화면 경로 갱신, stop → 멈춤
const WORKER_SRC = `
let timer = null
let url = ''
let path = '/'
function send() {
  if (!url) return
  fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: path }) }).catch(function () {})
}
onmessage = function (e) {
  var d = e.data || {}
  if (d.type === 'path') path = d.path || '/'
  else if (d.type === 'start') {
    url = d.url
    if (d.path) path = d.path
    if (timer) clearInterval(timer)
    timer = setInterval(send, d.ms || 20000)
  } else if (d.type === 'stop') {
    if (timer) clearInterval(timer)
    timer = null
  }
}
`

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
  function active() {
    return !!me.value && !impersonating()
  }

  // ── 20초 신호: 작업자(숨은 탭에서도 늦춰지지 않음) ──
  let worker: Worker | null = null
  try {
    if (typeof Worker !== 'undefined') {
      const blobUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }))
      worker = new Worker(blobUrl)
    }
  } catch {
    worker = null
  }
  let workerRunning = false
  function syncWorker() {
    if (!worker) return
    const path = router.currentRoute.value.path
    if (active()) {
      if (!workerRunning) {
        worker.postMessage({ type: 'start', url: `${location.origin}/api/presence`, ms: HEARTBEAT_MS, path })
        workerRunning = true
      } else {
        worker.postMessage({ type: 'path', path })
      }
    } else if (workerRunning) {
      worker.postMessage({ type: 'stop' })
      workerRunning = false
    }
  }

  // 화면을 옮기거나 다시 볼 때는 바로 한 번 보낸다(작업자가 없으면 이 함수가 20초 신호도 맡는다).
  function beat(force = false) {
    if (!active()) return
    const path = router.currentRoute.value.path
    const now = Date.now()
    if (!force && path === lastPath && now - lastAt < HEARTBEAT_MS - 1000) return
    lastPath = path
    lastAt = now
    $fetch('/api/presence', { method: 'POST', body: { path } }).catch(() => {})
  }

  // 탭/창을 닫을 때는 기다리지 않고 바로 "접속 종료"를 알린다(sendBeacon은 닫히는 중에도 전송된다).
  function leave() {
    if (!active()) return
    lastPath = ''
    try {
      navigator.sendBeacon('/api/presence', new Blob([JSON.stringify({ leave: true })], { type: 'application/json' }))
    } catch {
      // ignore
    }
  }

  router.afterEach(() => {
    beat(true)
    syncWorker()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') beat(true)
  })
  // 닫았다가 뒤로가기 캐시로 다시 열린 경우(접속 종료를 보냈으므로) 다시 알린다
  window.addEventListener('pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) {
      beat(true)
      syncWorker()
    }
  })
  window.addEventListener('pagehide', leave)
  // 로그인/로그아웃하면 작업자를 켜고 끈다
  watch(
    () => [me.value?.id, impersonating()],
    () => {
      syncWorker()
      beat(true)
    }
  )
  if (!worker) setInterval(() => beat(false), HEARTBEAT_MS)
  setTimeout(() => {
    beat(true)
    syncWorker()
  }, 2500)
})
