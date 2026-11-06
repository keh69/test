// 브라우저 알림음 없이도(오디오 파일 없이) 재생 가능한 짧은 "띵동" 2음 차임을 Web Audio API로 만든다.
function playChimeSound() {
  if (!process.client) return
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const notes: Array<[number, number]> = [
      [880, 0], // 띵(높은 음)
      [659, 0.16] // 동(낮은 음)
    ]
    for (const [freq, offset] of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.28, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.45)
    }
    setTimeout(() => {
      ctx.close().catch(() => {})
    }, 900)
  } catch {
    // 자동재생 정책 등으로 실패해도 조용히 무시(토스트/뱃지로는 계속 알림)
  }
}

// 팝업 닫힘 타이머는 화면 전체에서 하나만 쓴다(레이아웃과 화면 이동 알림이 같은 팝업을 쓰므로).
let toastTimer: any = null
// 쪽지를 읽는 화면에서는 "안 읽은 쪽지" 팝업을 띄우지 않는다.
const READING_PATHS = ["/support"]

export function useMessages() {
  const unread = useState<number>('messages_unread_count', () => 0)
  const loading = useState<boolean>('messages_unread_loading', () => false)
  const toast = useState<{ visible: boolean; text: string } | null>('messages_toast', () => null)
  let pollTimer: any = null
  let initialized = false
  // 이번 화면(탭)에 들어와서 미확인 쪽지가 있을 때 울리는 "진입 알림음"은 세션당 한 번만 울린다.
  let entryChimePlayed = false

  function showToast(text: string) {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { visible: true, text }
    toastTimer = setTimeout(() => {
      toast.value = null
    }, 6000)
  }

  // "새 쪽지가 도착했습니다" 팝업을 누르면 고객센터로 가서 그 쪽지(가장 최근 안 읽은 대화)를 바로 연다.
  function openNewMessage() {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = null
    return navigateTo({ path: '/support', query: { open: String(Date.now()) } })
  }

  // 실시간 도착 알림음은 총관리자 또는 "어드민권한"(쪽지관리 수정 권한)이 있는 관리자만 울린다.
  function canHearRealtimeChime(): boolean {
    const { me } = useMe()
    if (!me.value) return false
    if (me.value.role === 'user') return false
    if (me.value.role === 'super_admin') return true
    return (me.value as any)?.permissions?.menus?.messages?.edit === true
  }

  // 쪽지관리를 "보임"만 가진 부관리자는 볼 수만 있고 알람(팝업/소리)은 받지 않는다.
  function isViewOnlyAdmin(): boolean {
    const { me } = useMe()
    if (!me.value || me.value.role === 'user' || me.value.role === 'super_admin') return false
    return (me.value as any)?.permissions?.menus?.messages?.edit !== true
  }

  async function refreshUnread() {
    if (loading.value) return
    loading.value = true
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const data = await $fetch<{ unread: number }>('/api/messages/unread', { credentials: 'include', headers })
      const next = Number(data.unread || 0)
      // 새 쪽지가 실시간으로 도착한 경우에만 팝업+알림음(최초 로드 시에는 띄우지 않음)
      if (process.client && initialized && next > unread.value && !isViewOnlyAdmin()) {
        const { t } = useLocale()
        showToast(t('새 쪽지가 도착했습니다.', 'A new message has arrived.'))
        if (canHearRealtimeChime()) playChimeSound()
      }
      // 화면에 처음 들어왔을 때 이미 확인 안 한 쪽지가 있으면, 세션당 한 번 진입 알림음을 울린다.
      if (process.client && !entryChimePlayed && !initialized && next > 0 && !isViewOnlyAdmin()) {
        entryChimePlayed = true
        playChimeSound()
      }
      unread.value = next
      initialized = true
    } catch (e: any) {
      unread.value = 0
      // 로그인 세션이 만료된 상태로 폴링이 계속 돌면 5초마다 같은 401만 반복되므로,
      // 그 경우엔 폴링을 멈춘다(다시 로그인해서 레이아웃이 재마운트되면 새로 시작됨).
      const status = e?.response?.status ?? e?.statusCode
      if (status === 401) {
        stopUnreadPolling()
        // 로그인해 있던 회원의 세션이 끊김(관리자 차단 등) → 로그아웃 처리하고 홈페이지 첫 화면으로
        const { me } = useMe()
        if (process.client && me.value) {
          me.value = null
          navigateTo('/')
        }
      }
    } finally {
      loading.value = false
    }
  }

  function startUnreadPolling() {
    if (!process.client) return
    if (pollTimer) clearInterval(pollTimer)
    // 안 읽은 쪽지 확인: 8초 간격(예전 5초). 가려진 탭에서도 새 쪽지 알림음이 울려야 하므로 화면이 가려져도 계속 확인한다.
    pollTimer = setInterval(() => {
      refreshUnread()
    }, 5000)
  }

  function stopUnreadPolling() {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
  }

  // 어떤 화면에 들어가든(화면 이동이 끝날 때마다) 안 읽은 쪽지가 남아 있으면 "새 쪽지가 도착했습니다" 팝업을 띄운다(회원·관리자 모두).
  // 알림음은 울리지 않는다(진입 알림음/실시간 도착 알림음은 기존 규칙 그대로).
  async function remindUnreadOnEnter(path: string) {
    if (!process.client) return
    const { me } = useMe()
    if (!me.value || isViewOnlyAdmin()) return
    if (READING_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return
    try {
      const data = await $fetch<{ unread: number }>('/api/messages/unread', { credentials: 'include' })
      const n = Number(data.unread || 0)
      unread.value = n
      if (n > 0) {
        const { t } = useLocale()
        showToast(t('새 쪽지가 도착했습니다.', 'A new message has arrived.'))
      }
    } catch {
      // 확인 실패 시 조용히 넘어간다
    }
  }

  return { unread, loading, toast, refreshUnread, startUnreadPolling, stopUnreadPolling, openNewMessage, remindUnreadOnEnter }
}
