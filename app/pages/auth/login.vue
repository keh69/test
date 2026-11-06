<template>
  <div class="relative left-1/2 right-1/2 -mx-[50vw] -my-6 w-screen min-h-[calc(100vh-73px)]">
    <!-- 가입승인 대기 안내 팝업 -->
    <div v-if="pendingPopup" class="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4" @click.self="closePendingPopup">
      <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-center shadow-2xl">
        <div class="text-3xl">⏳</div>
        <div class="mt-3 text-lg font-semibold text-white">{{ t('가입승인 대기중입니다.', 'Your sign-up is awaiting approval.') }}</div>
        <p class="mt-2 text-sm text-slate-400">{{ t('관리자가 승인하면 로그인할 수 있습니다.', 'You can log in once an administrator approves it.') }}</p>
        <button type="button" class="mt-5 w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400" @click="closePendingPopup">{{ t('확인', 'OK') }}</button>
      </div>
    </div>
    <div class="grid min-h-[calc(100vh-73px)] md:grid-cols-2">
      <!-- 왼쪽: 브랜드 소개 패널 -->
      <div class="hex-pattern relative hidden overflow-hidden bg-[#0a0d13] px-16 py-16 md:flex md:flex-col md:items-center md:justify-center">
        <div class="relative z-10 mx-auto max-w-md">
          <h1 class="text-5xl font-black leading-tight text-white">
            {{ t('더 넓은 시장을', 'A wider market,') }}<br />
            {{ t('하나의 계정으로.', 'one account.') }}
          </h1>
          <p class="mt-5 text-sm leading-6 text-slate-400">
            <BrandText
              :text="t(
                `KYC 인증으로 전세계 300개 이상의 실시간 선물과 자산 관리를 연결하는 ${appName} 거래 환경을 지금 만나보세요.`,
                `Meet ${appName}'s trading environment, connecting real-time futures and asset management across 300+ instruments worldwide with KYC verification.`
              )"
            />
          </p>

          <div class="mt-10 border-t border-white/10 pt-8">
            <div class="grid grid-cols-3 gap-x-6 gap-y-8">
              <div v-for="item in features" :key="item.label" class="flex flex-col items-center gap-2 text-center">
                <div class="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 text-sm font-bold text-white">
                  {{ item.icon }}
                </div>
                <span class="text-[11px] font-semibold tracking-wide text-slate-300"><BrandText :text="item.label" /></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 로그인 폼 -->
      <div class="flex flex-col justify-center bg-[#050709] px-6 py-16 sm:px-12 md:px-20">
        <div class="mx-auto w-full max-w-sm">
          <h2 class="text-2xl font-bold text-white">{{ t('로그인', 'Log In') }}</h2>
          <p class="mt-2 text-sm text-slate-400">{{ t('계정에 로그인하세요', 'Log in to your account') }}</p>

          <form class="mt-8 space-y-5" @submit.prevent="onSubmit">
            <div>
              <label class="text-xs font-semibold tracking-wide text-slate-300">{{ t('아이디', 'ID') }}</label>
              <input
                :key="`username-${locale}`"
                v-model.trim="username"
                :placeholder="t('아이디', 'ID')"
                class="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/60"
              />
            </div>
            <div>
              <label class="text-xs font-semibold tracking-wide text-slate-300">PASSWORD</label>
              <input
                :key="`password-${locale}`"
                v-model="password"
                type="password"
                :placeholder="t('비밀번호', 'Password')"
                class="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/60"
              />
            </div>

            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center gap-2 text-slate-300">
                <input v-model="rememberId" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5 accent-emerald-500" />
                {{ t('아이디 저장', 'Remember ID') }}
              </label>
              <NuxtLink to="/auth/find-password" class="font-semibold text-white underline underline-offset-4 hover:text-emerald-300">
                {{ t('비밀번호를 잊으셨나요?', 'Forgot your password?') }}
              </NuxtLink>
            </div>

            <button
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
              :disabled="loading"
            >
              <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/40 border-t-slate-950" />
              <span>{{ loading ? t('로그인 중...', 'Logging in...') : t('로그인', 'Log In') }}</span>
            </button>
            <!-- 비밀번호 5회 오류 접속제한: 고객센터(관리자)에 문의 → 관리자가 비밀번호를 초기화하면 풀린다 -->
            <div v-if="locked" class="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              <div class="font-semibold">{{ t('접속이 제한된 계정입니다', 'This account is locked') }}</div>
              <p class="mt-1 text-rose-200/90">
                {{ t('비밀번호를 5회 잘못 입력하여 접속이 제한되었습니다. 고객센터로 문의해 주시면 관리자가 비밀번호를 초기화해 드립니다.', 'Your account was locked after 5 wrong passwords. Please contact customer support and an administrator will reset your password.') }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="rounded-md bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-400" @click="openSupportChat">
                  {{ t('고객센터 문의하기', 'Contact support') }}
                </button>
                <NuxtLink to="/auth/find-password" class="rounded-md px-3 py-2 text-xs font-semibold text-rose-100 ring-1 ring-rose-400/50 hover:bg-rose-500/20">
                  {{ t('관리자에게 비밀번호 초기화 요청', 'Request a password reset') }}
                </NuxtLink>
              </div>
            </div>
            <p v-else-if="error" class="text-sm text-rose-300">{{ error }}</p>
          </form>

          <div class="mt-6 text-center text-sm text-slate-400">
            {{ t('계정이 없으신가요?', "Don't have an account?") }}
            <NuxtLink to="/auth/register" class="font-semibold text-white underline underline-offset-4 hover:text-emerald-300">{{ t('회원가입', 'Sign Up') }}</NuxtLink>
          </div>

          <div class="mt-10 flex items-center justify-center gap-3 text-xs text-slate-600">
            <NuxtLink to="/legal/terms" class="hover:text-slate-400">{{ t('이용약관', 'Terms of Service') }}</NuxtLink>
            <span>·</span>
            <NuxtLink to="/legal/privacy" class="hover:text-slate-400">{{ t('개인정보처리방침', 'Privacy Policy') }}</NuxtLink>
            <span>·</span>
            <a v-if="telegramUrl" :href="telegramUrl" target="_blank" rel="noopener" class="hover:text-slate-400">{{ t('고객지원', 'Support') }}</a>
            <NuxtLink v-else to="/support" class="hover:text-slate-400">{{ t('고객지원', 'Support') }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 전체 화면 로딩 오버레이 -->
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="loading"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-sm"
        aria-live="polite"
        aria-busy="true"
      >
        <div class="w-[320px] rounded-2xl border border-white/10 bg-[#0b1220] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400/25 border-t-emerald-300" />
            <div>
              <div class="text-sm font-semibold text-slate-100">{{ t(loadingTitle, loadingTitleEn) }}</div>
              <div class="mt-1 text-xs text-slate-400">{{ t(loadingDesc, loadingDescEn) }}</div>
            </div>
          </div>
          <div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div class="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
const { refresh } = useMe()
const config = useRuntimeConfig()
const appName = config.public.appName
const { t, locale } = useLocale()

const SAVED_ID_KEY = 'bitduck_saved_login_id'

const username = ref('')
const password = ref('')
const rememberId = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
// 가입승인 대기 안내 팝업
const pendingPopup = ref(false)
function closePendingPopup() {
  pendingPopup.value = false
}
// 비밀번호 5회 오류로 접속제한된 계정이면 true(고객센터 안내를 보여준다)
const locked = ref(false)

function openSupportChat() {
  window.dispatchEvent(new CustomEvent('ktx:open-guest-chat'))
}
const loadingTitle = ref('접속 중입니다...')
const loadingDesc = ref('인증 정보를 확인하고 있습니다.')
const loadingTitleEn = ref('Connecting...')
const loadingDescEn = ref('Checking your credentials.')

const features = [
  { icon: 'F', label: 'FUTURES' },
  { icon: '₮', label: 'USDT' },
  { icon: '↗', label: 'LIVE' },
  { icon: '2', label: '2FA' },
  { icon: '◈', label: 'WALLET' },
  { icon: 'BP', label: appName }
]

const telegramUrl = ref('')

onMounted(() => {
  const saved = localStorage.getItem(SAVED_ID_KEY)
  if (saved) {
    username.value = saved
    rememberId.value = true
  }
  $fetch<{ telegramUrl: string }>('/api/settings/telegram')
    .then((res) => { telegramUrl.value = String(res?.telegramUrl || '') })
    .catch(() => {})
})

async function onSubmit() {
  loading.value = true
  error.value = null
  locked.value = false
  loadingTitle.value = '접속 중입니다...'
  loadingDesc.value = '서버에 연결하고 있습니다.'
  loadingTitleEn.value = 'Connecting...'
  loadingDescEn.value = 'Connecting to the server.'
  try {
    // 1) 로그인
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value, remember: rememberId.value }
    })

    // 아이디 저장 체크 여부에 따라 이 컴퓨터에 아이디를 남기거나 지운다.
    if (rememberId.value) {
      localStorage.setItem(SAVED_ID_KEY, username.value)
    } else {
      localStorage.removeItem(SAVED_ID_KEY)
    }

    // 2) 세션/유저 갱신
    loadingTitle.value = '인증 확인 중입니다...'
    loadingDesc.value = '세션을 적용하고 있습니다.'
    loadingTitleEn.value = 'Verifying...'
    loadingDescEn.value = 'Applying your session.'
    await refresh()

    // 3) 이동
    loadingTitle.value = '거래소로 이동 중입니다...'
    loadingDesc.value = '잠시만 기다려주세요.'
    loadingTitleEn.value = 'Redirecting to the exchange...'
    loadingDescEn.value = 'Please wait a moment.'
    await navigateTo('/exchange/SAMSUNGUSDT')
  } catch (e: any) {
    const info = e?.data?.data || {}
    // 가입 거절된 계정: 아무 안내 없이 홈페이지 첫 화면으로
    if (info.rejected) {
      error.value = null
      await navigateTo('/')
      return
    }
    // 가입 승인 대기: 팝업으로 안내
    if (info.pending) {
      error.value = null
      pendingPopup.value = true
      return
    }
    locked.value = Number(e?.statusCode || e?.data?.statusCode) === 423
    error.value = e?.data?.statusMessage || t('로그인에 실패했습니다.', 'Login failed.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes progress {
  0% {
    transform: translateX(-120%);
  }
  50% {
    transform: translateX(180%);
  }
  100% {
    transform: translateX(420%);
  }
}

.hex-pattern {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='96' viewBox='0 0 84 96'%3E%3Cpath fill='none' stroke='%23ffffff' stroke-opacity='0.06' stroke-width='1' d='M42 0 84 24 84 72 42 96 0 72 0 24Z'/%3E%3C/svg%3E");
  background-position: 0 0;
  background-repeat: repeat;
}

.hex-pattern::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.08), transparent 45%);
  pointer-events: none;
}
</style>
