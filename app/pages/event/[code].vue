<template>
  <!-- 프로모션 페이지는 화이트 테마(반전 필터)에서도 원래 색(어두운 배경 + 금색)으로 보이게 data-keep-colors로 고정한다. -->
  <div class="evp" data-keep-colors>
    <div v-if="pending && !data" class="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">{{ t('불러오는 중…', 'Loading…') }}</div>
    <div v-else-if="error || !data" class="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <div class="text-4xl">🏆</div>
      <div class="text-base text-slate-300">{{ error?.data?.statusMessage || t('진행 중인 이벤트가 아닙니다.', 'This event is not running.') }}</div>
      <NuxtLink to="/" class="rounded-full bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/15">{{ t('홈으로', 'Home') }}</NuxtLink>
    </div>

    <template v-else>
      <!-- ① 히어로: 큰 제목 + 총상금 + 트로피 -->
      <section class="evp-hero relative overflow-hidden">
        <div class="evp-rays" />
        <span v-for="c in confetti" :key="c.i" class="evp-confetti" :style="c.style" />
        <div class="relative mx-auto max-w-[760px] px-5 pb-10 pt-10 text-center sm:pt-14">
          <div class="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-black/40 px-4 py-1.5 text-[13px] font-semibold text-amber-200 backdrop-blur">
            <span class="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            {{ evName }} · {{ t('주간 거래 대회', 'Weekly trading contest') }}
          </div>
          <h1 class="evp-title mt-5 text-[34px] font-black leading-[1.15] tracking-tight text-white sm:text-[52px]">
            {{ titleLines[0] }}<br v-if="titleLines[1]" />
            <span v-if="titleLines[1]" class="evp-gold">{{ titleLines[1] }}</span>
          </h1>

          <!-- 트로피(픽셀아트): 33×40칸 그림을 정수배(6배/7배)로 키워 칸 경계가 흐려지지 않게 한다 -->
          <div class="relative mx-auto mt-6 h-[240px] w-[198px] sm:h-[280px] sm:w-[231px]">
            <div class="evp-glow" />
            <PixelTrophy class="evp-trophy relative h-full w-full" />
          </div>

          <div class="mt-4 text-[15px] font-semibold text-amber-100/90">{{ t('이번 회차 총상금', 'Total prize this round') }}</div>
          <div class="evp-prize mt-1 text-[46px] font-black leading-none sm:text-[64px]">
            {{ totalPrizeText }}
          </div>

          <!-- 남은 시간 -->
          <div v-if="week === 'this'" class="mt-6 flex items-center justify-center gap-2">
            <div v-for="u in countdown" :key="u.label" class="w-[64px] rounded-xl border border-white/10 bg-black/50 py-2">
              <div class="font-mono text-2xl font-bold text-white">{{ u.value }}</div>
              <div class="text-[11px] text-slate-400">{{ u.label }}</div>
            </div>
          </div>
          <div class="mt-4 inline-flex items-center gap-2 text-[13px] text-slate-300">
            <span class="rounded bg-white/10 px-2 py-0.5 text-[12px] text-slate-200">{{ t('기간', 'Period') }}</span>
            {{ fmtDayTime(data.period.from) }} ~ {{ fmtDayTime(data.period.to) }} ({{ t('한국시간', 'KST') }})
          </div>

          <div class="mt-7">
            <NuxtLink to="/exchange/SAMSUNGUSDT" class="evp-cta inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-[18px] font-extrabold text-[#3a2400]">
              {{ t('지금 거래하러 가기', 'Start trading now') }} <span aria-hidden="true">›</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- ② 상금표 -->
      <section class="bg-[#0b0d14] py-12">
        <div class="mx-auto max-w-[760px] px-5">
          <div class="text-center">
            <div class="evp-ribbon">{{ t('상금과 혜택', 'Prizes') }}</div>
            <p class="mt-3 text-sm text-slate-400">{{ t(`이번 회차 ${metricKo} 순위에 따라 상금을 드립니다`, `Prizes by this round's ${metricEn.toLowerCase()} ranking`) }}</p>
          </div>
          <div class="mt-7 grid gap-3 sm:grid-cols-2">
            <div v-for="(p, i) in data.event.prizes" :key="i" class="evp-ticket" :class="ticketClass(i)">
              <div class="evp-ticket-rank">
                <span class="evp-medal" :class="medalClass(i)">{{ medalText(p.rank, i) }}</span>
                <span class="text-[15px] font-bold text-white">{{ rankLabel(p.rank) }}</span>
              </div>
              <div class="evp-ticket-amount">{{ p.reward }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ③ 참여 방법 -->
      <section class="bg-gradient-to-b from-[#0b0d14] to-[#11131c] py-12">
        <div class="mx-auto max-w-[760px] px-5">
          <div class="text-center">
            <div class="evp-ribbon">{{ t('참여 방법', 'How to join') }}</div>
            <p class="mt-3 text-sm text-slate-400">{{ t('신청 없이 거래만 하면 자동으로 참여됩니다', 'No sign-up needed — just trade') }}</p>
          </div>
          <ol class="evp-steps mt-8">
            <li v-for="(s, i) in steps" :key="i" class="evp-step">
              <span class="evp-step-no">{{ i + 1 }}</span>
              <div>
                <div class="text-[17px] font-bold text-white">{{ s.title }}</div>
                <div class="mt-0.5 text-[13px] text-slate-400">{{ s.desc }}</div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <!-- ④ 순위 -->
      <section class="bg-[#11131c] py-12">
        <div class="mx-auto max-w-[760px] px-5">
          <div class="text-center">
            <div class="evp-ribbon">{{ week === 'last' ? t('지난 주 순위', 'Last week') : t('실시간 순위', 'Live ranking') }}</div>
            <div class="mt-4 inline-flex gap-1 rounded-full bg-black/40 p-1 text-[13px]">
              <button type="button" class="rounded-full px-4 py-1.5" :class="week === 'this' ? 'bg-amber-400 font-bold text-slate-900' : 'text-slate-300'" @click="week = 'this'">{{ t('이번 주', 'This week') }}</button>
              <button type="button" class="rounded-full px-4 py-1.5" :class="week === 'last' ? 'bg-amber-400 font-bold text-slate-900' : 'text-slate-300'" @click="week = 'last'">{{ t('지난 주', 'Last week') }}</button>
            </div>
          </div>

          <!-- 내 기록 -->
          <div class="mt-6 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-transparent p-4">
            <div v-if="!data.loggedIn" class="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
              <span>{{ t('로그인하면 내 순위를 볼 수 있어요', 'Log in to see your rank') }}</span>
              <NuxtLink to="/auth/login" class="rounded-full bg-amber-400 px-4 py-1.5 text-[13px] font-bold text-slate-900">{{ t('로그인', 'Log in') }}</NuxtLink>
            </div>
            <div v-else class="grid grid-cols-3 gap-2 text-center">
              <div>
                <div class="text-[12px] text-amber-200/80">{{ t('내 순위', 'My rank') }}</div>
                <div class="mt-1 text-xl font-black text-white">{{ data.mine?.rank ? t(`${data.mine.rank}위`, `#${data.mine.rank}`) : '—' }}</div>
              </div>
              <div>
                <div class="text-[12px] text-amber-200/80">{{ t(`내 ${metricKo}`, `My ${metricEn.toLowerCase()}`) }}</div>
                <div class="mt-1 text-xl font-black text-white">{{ fmtMetricShort(data.mine?.volume || 0) }}</div>
              </div>
              <div>
                <div class="text-[12px] text-amber-200/80">{{ t('예상 상금', 'Expected prize') }}</div>
                <div class="mt-1 text-xl font-black text-amber-300">{{ data.mine?.rank ? prizeFor(data.mine.rank) || '—' : '—' }}</div>
              </div>
            </div>
          </div>

          <div v-if="!data.ranking.length" class="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-400">
            {{ t('아직 기록이 없습니다. 첫 번째 주인공이 되어 보세요!', 'No records yet. Be the first!') }}
          </div>
          <template v-else>
            <!-- 시상대(1~3위) -->
            <div class="mt-8 grid grid-cols-3 items-end gap-2 sm:gap-4">
              <div v-for="slot in podium" :key="slot.place" class="text-center">
                <template v-if="slot.row">
                  <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-black" :class="medalClass(slot.place - 1)">{{ slot.place }}</div>
                  <div class="mt-2 truncate font-mono text-[14px] font-bold text-white">{{ slot.row.name }}<span v-if="slot.row.isMe" class="text-amber-300"> ({{ t('나', 'me') }})</span></div>
                  <div class="text-[12px] text-slate-400">{{ fmtMetricShort(slot.row.volume) }}</div>
                  <div class="evp-podium mt-2" :class="`evp-podium-${slot.place}`">
                    <span class="text-[13px] font-bold text-amber-200">{{ prizeFor(slot.place) }}</span>
                  </div>
                </template>
              </div>
            </div>
            <!-- 1~100위 순위표: 한 페이지 10위씩, 옆으로 넘김(화살표·번호·밀어서 넘기기), 내 순위 강조 -->
            <div class="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div class="text-[14px] font-bold text-white">
                  {{ t('전체 순위', 'Full ranking') }}
                  <span class="ml-1 text-[12px] font-normal text-slate-400">{{ pageFrom }}~{{ pageTo }}{{ t('위', '') }} / {{ data.ranking.length }}{{ t('명', '') }}</span>
                </div>
                <button
                  v-if="myRow"
                  type="button"
                  class="rounded-full bg-amber-400 px-3 py-1 text-[12px] font-bold text-slate-900 hover:bg-amber-300"
                  @click="goToMyPage"
                >
                  {{ t('내 순위 보기', 'Jump to me') }}
                </button>
              </div>
              <div class="grid grid-cols-[44px_minmax(0,1fr)_auto_84px] gap-x-3 border-b border-white/5 px-4 py-2 text-[11px] text-slate-500">
                <span class="text-center">{{ t('순위', 'Rank') }}</span>
                <span>{{ t('아이디', 'ID') }}</span>
                <span class="text-right">{{ t(`${metricKo} (${metricUnit})`, `${metricEn} (${metricUnitEn})`) }}</span>
                <span class="text-right">{{ t('상금', 'Prize') }}</span>
              </div>
              <div class="evp-pages" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
                <!-- 넘길 때 옆에서 밀려 들어오는 효과(위치만 움직여서, 효과가 멈춰도 내용은 항상 보인다) -->
                <div :key="page" :class="slideDir === 'next' ? 'evp-slide-in-next' : 'evp-slide-in-prev'">
                    <div
                      v-for="r in pageRows"
                      :key="r.rank"
                      class="grid grid-cols-[44px_minmax(0,1fr)_auto_84px] items-center gap-x-3 border-b border-white/5 px-4 py-3 last:border-b-0"
                      :class="r.isMe ? 'evp-me' : ''"
                    >
                      <span class="flex justify-center">
                        <span v-if="r.rank <= 3" class="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-black" :class="medalClass(r.rank - 1)">{{ r.rank }}</span>
                        <span v-else class="font-mono text-[15px] font-bold" :class="r.isMe ? 'text-amber-300' : 'text-slate-300'">{{ r.rank }}</span>
                      </span>
                      <span class="min-w-0 truncate font-mono text-[14px]" :class="r.isMe ? 'font-bold text-white' : 'text-slate-100'">
                        {{ r.name }}<span v-if="r.isMe" class="ml-1 rounded bg-amber-400 px-1.5 py-0.5 font-sans text-[10px] font-bold text-slate-900">{{ t('나', 'ME') }}</span>
                      </span>
                      <span class="text-right font-mono text-[14px]" :class="r.isMe ? 'text-white' : 'text-slate-200'">{{ fmtMetric(r.volume) }}</span>
                      <span class="text-right text-[12px] font-semibold text-amber-300">{{ prizeFor(r.rank) || '—' }}</span>
                    </div>
                    <!-- 마지막 페이지가 10줄보다 적어도 표 높이가 흔들리지 않게 빈 줄을 채운다 -->
                    <div v-for="n in PAGE_SIZE - pageRows.length" :key="'e' + n" class="h-[49px] border-b border-white/5 last:border-b-0" />
                </div>
              </div>
              <div class="flex items-center justify-center gap-1 border-t border-white/10 px-2 py-3">
                <button type="button" class="evp-pg" :disabled="page <= 1" :aria-label="t('이전', 'Previous')" @click="setPage(page - 1)">‹</button>
                <button
                  v-for="n in visiblePages"
                  :key="n"
                  type="button"
                  class="evp-pg"
                  :class="[n === page ? 'evp-pg-on' : '', myPage === n && n !== page ? 'evp-pg-me' : '']"
                  @click="setPage(n)"
                >
                  {{ n }}
                </button>
                <button type="button" class="evp-pg" :disabled="page >= pageCount" :aria-label="t('다음', 'Next')" @click="setPage(page + 1)">›</button>
              </div>
            </div>
            <p class="mt-3 text-center text-[12px] text-slate-500">{{ t('1분마다 자동으로 갱신됩니다 · 다른 회원 아이디는 일부 가려집니다', 'Refreshes every minute · other IDs are partly hidden') }}</p>
          </template>
        </div>
      </section>

      <!-- ⑤ 꼭 확인하세요 -->
      <section class="bg-[#07080c] py-10">
        <div class="mx-auto max-w-[760px] px-5">
          <div class="flex items-center gap-2 text-[15px] font-bold text-white">
            <span class="flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-[12px]">!</span>
            {{ t('꼭 확인하세요!', 'Please note') }}
          </div>
          <p v-if="evDescription" class="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-slate-300">{{ evDescription }}</p>
          <ul class="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-slate-400">
            <li>{{ t(`이벤트는 한국시간 기준 ${closeKo}에 마감되며, 마감 직후 새 회차가 시작됩니다.`, `Each round closes ${closeEn} (KST) and the next round starts right away.`) }}</li>
            <li>{{ metricRuleText }}</li>
            <li>{{ t('관리자·운영 계정은 순위에서 제외됩니다.', 'Admin accounts are excluded.') }}</li>
            <li>{{ t('자전거래 등 비정상적인 거래가 확인되면 순위와 상금에서 제외될 수 있습니다.', 'Abnormal trading may be excluded from rankings and prizes.') }}</li>
            <li>{{ t('상금은 이벤트 종료 후 최종 순위를 확인해 지급합니다.', 'Prizes are paid after the final ranking is confirmed.') }}</li>
            <li>{{ t('이벤트 내용은 회사 사정에 따라 변경되거나 조기 종료될 수 있습니다.', 'The event may change or end early.') }}</li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useLocale()
const route = useRoute()
const code = computed(() => String(route.params.code || ''))
const week = ref<'this' | 'last'>('this')

type EventDetail = {
  event: {
    code: string
    name: string
    kind: string
    title: string
    description: string
    nameEn?: string
    titleEn?: string
    descriptionEn?: string
    prizes: Array<{ rank: string; reward: string }>
  }
  // 순위 점수 이름/단위(거래량 USDT, 거래횟수 회, 수익률 % 등) — 점수는 ranking[].volume 에 담겨 온다
  metric?: { ko: string; en: string; unit: string; decimals: number; kindKo: string; kindEn: string }
  closeLabel?: { ko: string; dow: number; time: string }
  period: { from: string; to: string; week: string }
  ranking: Array<{ rank: number; name: string; isMe: boolean; volume: number; trades: number }>
  mine: { rank: number | null; volume: number; trades: number } | null
  loggedIn: boolean
}

const { data, pending, error, refresh } = await useFetch<EventDetail>(() => `/api/events/${encodeURIComponent(code.value)}`, {
  query: computed(() => ({ week: week.value })),
  watch: [week]
})

// 언어에 맞는 이름/제목/설명(영어가 비어 있으면 한국어로 보여 준다)
const isEn = computed(() => String(locale.value || '').toLowerCase().startsWith('en'))
const evName = computed(() => (isEn.value && data.value?.event.nameEn) || data.value?.event.name || '')
const evTitle = computed(() => (isEn.value && data.value?.event.titleEn) || data.value?.event.title || '')
const evDescription = computed(() => (isEn.value && data.value?.event.descriptionEn) || data.value?.event.description || '')
// 상금표의 순위 글자("1위", "4~10위")도 영어 화면에서는 "Rank 1", "Rank 4–10"으로
function rankLabel(rank: string) {
  if (!isEn.value) return rank
  const r = rankRange(rank)
  if (!r) return rank
  return r[0] === r[1] ? `Rank ${r[0]}` : `Rank ${r[0]}–${r[1]}`
}

// 제목을 두 줄로: 마지막 낱말 묶음을 금색 강조 줄로 (예: "이번주 거래량" / "순위 이벤트")
const titleLines = computed(() => {
  const s = String(evTitle.value || '').trim()
  const words = s.split(/\s+/)
  if (words.length < 3) return [s, '']
  const cut = Math.ceil(words.length / 2)
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
})

// "4~10위 · 30 USDT"처럼 범위가 있으면 인원수만큼 곱해 총상금을 계산한다.
function rankRange(rank: string): [number, number] | null {
  const m = String(rank).match(/(\d+)\s*[~\-]\s*(\d+)/)
  if (m) return [Number(m[1]), Number(m[2])]
  const one = String(rank).match(/(\d+)/)
  return one ? [Number(one[1]), Number(one[1])] : null
}
const totalPrizeText = computed(() => {
  let total = 0
  let unit = ''
  for (const p of data.value?.event.prizes || []) {
    const amount = Number(String(p.reward).replace(/,/g, '').match(/[\d.]+/)?.[0])
    const r = rankRange(p.rank)
    if (!Number.isFinite(amount) || !r) return data.value?.event.prizes?.[0]?.reward || ''
    unit = unit || String(p.reward).replace(/[\d.,\s]/g, '')
    total += amount * (r[1] - r[0] + 1)
  }
  return total ? `${total.toLocaleString('en-US')} ${unit}`.trim() : ''
})
function prizeFor(rank: number) {
  for (const p of data.value?.event.prizes || []) {
    const r = rankRange(p.rank)
    if (r && rank >= r[0] && rank <= r[1]) return p.reward
  }
  return ''
}

const steps = computed(() => [
  { title: t('로그인', 'Log in'), desc: t('KTX 회원이면 누구나 자동 참여', 'Every KTX member joins automatically') },
  { title: t('선물 거래', 'Trade futures'), desc: t('거래할 때마다 순위 기록이 쌓여요', 'Every trade counts toward your ranking') },
  { title: t('실시간 순위 확인', 'Check the live ranking'), desc: t('이 페이지에서 내 순위를 바로 확인', 'See your rank right here') },
  { title: t('상금 지급', 'Get your prize'), desc: t('마감 후 순위대로 지갑에 자동 지급', 'Paid to your wallet by final rank after closing') }
])

// ── 1~100위 순위표(한 페이지 10위씩) ──
const PAGE_SIZE = 10
const page = ref(1)
const slideDir = ref<'next' | 'prev'>('next')
const rankingRows = computed(() => data.value?.ranking || [])
const pageCount = computed(() => Math.max(1, Math.ceil(rankingRows.value.length / PAGE_SIZE)))
const pageRows = computed(() => rankingRows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const pageFrom = computed(() => (rankingRows.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0))
const pageTo = computed(() => Math.min(rankingRows.value.length, page.value * PAGE_SIZE))
const myRow = computed(() => rankingRows.value.find((r) => r.isMe) || null)
const myPage = computed(() => (myRow.value ? Math.ceil(myRow.value.rank / PAGE_SIZE) : 0))
// 페이지 번호는 지금 페이지 주변 5개만(휴대폰에서도 한 줄에 들어가게)
const visiblePages = computed(() => {
  const total = pageCount.value
  const start = Math.max(1, Math.min(page.value - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
function setPage(n: number) {
  const next = Math.min(pageCount.value, Math.max(1, n))
  if (next === page.value) return
  slideDir.value = next > page.value ? 'next' : 'prev'
  page.value = next
}
function goToMyPage() {
  if (myPage.value) setPage(myPage.value)
}
// 처음 열었을 때 내 순위가 100위 안이면 내 페이지를 먼저 보여 준다(1분마다 새로 받아도 보던 페이지는 유지).
let autoJumped = false
watch(
  rankingRows,
  () => {
    if (page.value > pageCount.value) page.value = pageCount.value
    if (!autoJumped && myPage.value) {
      autoJumped = true
      page.value = myPage.value
    }
  },
  { immediate: true }
)
watch(week, () => {
  page.value = 1
  autoJumped = false
})
// 휴대폰에서 표를 옆으로 밀면 다음/이전 페이지
let touchX = 0
let touchY = 0
function onTouchStart(e: TouchEvent) {
  touchX = e.touches[0]?.clientX ?? 0
  touchY = e.touches[0]?.clientY ?? 0
}
function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX
  const dy = (e.changedTouches[0]?.clientY ?? 0) - touchY
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
  setPage(page.value + (dx < 0 ? 1 : -1))
}
function fmtUsd(v: number) {
  return Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
// ── 이벤트 종류별 점수 표시(거래량/거래횟수/배팅왕/수익왕/수익률왕/승리왕) ──
const metricKo = computed(() => data.value?.metric?.ko || '거래량')
const metricEn = computed(() => data.value?.metric?.en || 'Volume')
const metricUnit = computed(() => data.value?.metric?.unit || 'USDT')
const metricUnitEn = computed(() => (metricUnit.value === '회' ? 'times' : metricUnit.value))
const metricDecimals = computed(() => Number(data.value?.metric?.decimals ?? 2))
function fmtMetric(v: number) {
  const d = metricDecimals.value
  return Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}
function fmtMetricShort(v: number) {
  const u = isEn.value ? metricUnitEn.value : metricUnit.value
  if (metricUnit.value === 'USDT') return `${fmtShort(v)} USDT`
  if (metricUnit.value === '%') return `${fmtMetric(v)}%`
  return `${fmtMetric(v)}${isEn.value ? ' ' : ''}${u}`
}
const EN_DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const closeKo = computed(() => data.value?.closeLabel?.ko || '매주 월요일 00:00')
const closeEn = computed(() => `every ${EN_DOW[Number(data.value?.closeLabel?.dow) || 0]} ${data.value?.closeLabel?.time || '00:00'}`)
const metricRuleText = computed(() => {
  const k = data.value?.event.kind || 'weekly_volume'
  const rules: Record<string, [string, string]> = {
    weekly_volume: ['거래량은 선물 거래의 체결금액(진입 + 청산, USDT) 합계로 계산합니다.', 'Volume is the sum of filled amounts (open + close, USDT) of futures trades.'],
    trade_count: ['거래횟수는 회차 동안 청산까지 끝난 선물 거래의 횟수입니다.', 'Trade count is the number of futures trades closed in the round.'],
    max_bet: ['배팅왕은 한 번의 거래에 넣은 증거금(배팅금, USDT)이 가장 큰 순서로 정합니다.', 'Biggest bet ranks by the largest margin (USDT) put into a single trade.'],
    profit_sum: ['수익왕은 회차 동안 실현수익(USDT) 합계가 큰 순서로 정하며, 수익이 있는 회원만 순위에 오릅니다.', 'Top profit ranks by total realized profit (USDT); only members with profit are ranked.'],
    best_roe: ['수익률왕은 한 번의 거래에서 낸 수익률(ROE, %)이 가장 높은 순서로 정합니다.', 'Best ROE ranks by the highest return (%) on a single trade.'],
    win_count: ['승리왕은 회차 동안 수익으로 끝난 거래 횟수가 많은 순서로 정합니다.', 'Most wins ranks by the number of trades closed in profit.']
  }
  const r = rules[k] || rules.weekly_volume!
  return t(r[0], r[1])
})
function fmtDayTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
}

const podium = computed(() => {
  const rows = data.value?.ranking || []
  return [2, 1, 3].map((place) => ({ place, row: rows.find((r) => r.rank === place) || null }))
})

// 남은 시간(이번 주 마감까지)
const nowMs = ref(Date.now())
const countdown = computed(() => {
  const end = data.value ? new Date(data.value.period.to).getTime() : 0
  let s = Math.max(0, Math.floor((end - nowMs.value) / 1000))
  const d = Math.floor(s / 86400)
  s -= d * 86400
  const h = Math.floor(s / 3600)
  s -= h * 3600
  const m = Math.floor(s / 60)
  s -= m * 60
  const p = (n: number) => String(n).padStart(2, '0')
  return [
    { label: t('일', 'Days'), value: p(d) },
    { label: t('시간', 'Hrs'), value: p(h) },
    { label: t('분', 'Min'), value: p(m) },
    { label: t('초', 'Sec'), value: p(s) }
  ]
})

// 히어로 위에 떠다니는 색종이(화면에서만 계산)
const confetti = Array.from({ length: 18 }, (_, i) => {
  const colors = ['#ffd23f', '#ff6b6b', '#4dd4ac', '#5b8cff', '#ffffff']
  return {
    i,
    style: {
      left: `${(i * 53) % 100}%`,
      top: `${(i * 37) % 90}%`,
      background: colors[i % colors.length],
      transform: `rotate(${(i * 47) % 180}deg)`,
      animationDelay: `${(i % 6) * 0.6}s`
    }
  }
})

let tick: any = null
let poll: any = null
onMounted(() => {
  tick = setInterval(() => (nowMs.value = Date.now()), 1000)
  poll = setInterval(() => refresh(), 60000)
})
onBeforeUnmount(() => {
  if (tick) clearInterval(tick)
  if (poll) clearInterval(poll)
})

function medalClass(i: number) {
  if (i === 0) return 'evp-medal-gold'
  if (i === 1) return 'evp-medal-silver'
  if (i === 2) return 'evp-medal-bronze'
  return 'evp-medal-plain'
}
function medalText(rank: string, i: number) {
  const r = rankRange(rank)
  return r && r[0] === r[1] ? String(r[0]) : i < 3 ? String(i + 1) : '★'
}
function ticketClass(i: number) {
  return i === 0 ? 'evp-ticket-first sm:col-span-2' : ''
}
function fmtShort(v: number) {
  const n = Number(v || 0)
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toFixed(0)
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', weekday: 'short' })
}
// 기간 끝은 "다음 월요일 00:00"이라 화면에는 그 전날(일요일)로 보여 준다.
function lastDay(iso: string) {
  return new Date(new Date(iso).getTime() - 1000).toISOString()
}

useHead({ title: computed(() => (evTitle.value ? `${evTitle.value} | KTX` : 'KTX')) })
</script>

<style scoped>
.evp {
  background: #07080c;
  color: #e5e7eb;
}
.evp-hero {
  background:
    radial-gradient(ellipse 80% 60% at 50% 38%, rgba(255, 196, 0, 0.28), transparent 70%),
    radial-gradient(ellipse 60% 50% at 15% 0%, rgba(91, 140, 255, 0.25), transparent 70%),
    linear-gradient(180deg, #0d0a1f 0%, #120c05 100%);
}
.evp-rays {
  position: absolute;
  inset: -50%;
  background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(255, 210, 63, 0.07) 0deg 8deg, transparent 8deg 20deg);
  animation: evp-spin 60s linear infinite;
}
.evp-confetti {
  position: absolute;
  width: 8px;
  height: 14px;
  border-radius: 2px;
  opacity: 0.75;
  animation: evp-float 6s ease-in-out infinite;
}
.evp-title {
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
}
.evp-gold,
.evp-prize {
  background: linear-gradient(180deg, #fff6c8 0%, #ffd23f 45%, #e8930a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 4px 14px rgba(255, 170, 0, 0.35));
}
.evp-glow {
  position: absolute;
  inset: 10% 5% 0;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(255, 210, 63, 0.55), transparent 65%);
  filter: blur(10px);
}
.evp-trophy {
  image-rendering: pixelated;
  animation: evp-bob-pixel 2.4s steps(1, end) infinite;
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.5));
}
.evp-cta {
  background: linear-gradient(180deg, #ffe680 0%, #ffc21a 55%, #e89a00 100%);
  box-shadow:
    0 8px 0 #9a5f00,
    0 14px 30px rgba(255, 170, 0, 0.35);
  transition: transform 0.1s;
}
.evp-cta:active {
  transform: translateY(4px);
  box-shadow:
    0 4px 0 #9a5f00,
    0 8px 20px rgba(255, 170, 0, 0.35);
}
.evp-ribbon {
  display: inline-block;
  position: relative;
  padding: 10px 34px;
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  background: linear-gradient(180deg, #3a64ff, #1f3fd1);
  clip-path: polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%);
}
.evp-ticket {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1b1f2e, #141722);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.evp-ticket::before,
.evp-ticket::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  margin-top: -9px;
  border-radius: 9999px;
  background: #0b0d14;
}
.evp-ticket::before {
  left: -9px;
}
.evp-ticket::after {
  right: -9px;
}
.evp-ticket-first {
  padding: 26px 24px;
  background: linear-gradient(135deg, #3b2a00, #1d1500 60%, #2a1d00);
  border-color: rgba(255, 210, 63, 0.5);
  box-shadow: 0 0 30px rgba(255, 196, 0, 0.18) inset;
}
.evp-ticket-rank {
  display: flex;
  align-items: center;
  gap: 10px;
}
.evp-ticket-amount {
  font-size: 26px;
  font-weight: 900;
  background: linear-gradient(180deg, #fff6c8, #ffd23f 50%, #e8930a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.evp-ticket-first .evp-ticket-amount {
  font-size: 36px;
}
.evp-medal {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-weight: 900;
  font-size: 15px;
}
.evp-medal-gold {
  background: radial-gradient(circle at 35% 30%, #fff3b0, #ffc21a 60%, #b77400);
  color: #5a3500;
  box-shadow: 0 0 0 3px rgba(255, 210, 63, 0.25);
}
.evp-medal-silver {
  background: radial-gradient(circle at 35% 30%, #ffffff, #c9d1dc 60%, #7d8896);
  color: #2b333d;
}
.evp-medal-bronze {
  background: radial-gradient(circle at 35% 30%, #ffe0c2, #e08a4a 60%, #8a4a1c);
  color: #3d1d05;
}
.evp-medal-plain {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.evp-steps {
  position: relative;
  display: grid;
  gap: 14px;
}
.evp-steps::before {
  content: '';
  position: absolute;
  left: 25px;
  top: 20px;
  bottom: 20px;
  width: 3px;
  background: linear-gradient(180deg, #ffd23f, #e8930a);
  border-radius: 3px;
  opacity: 0.6;
}
.evp-step {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px 14px 0;
}
.evp-step-no {
  position: relative;
  z-index: 1;
  display: flex;
  flex: none;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 3px solid #ffd23f;
  background: radial-gradient(circle at 35% 30%, #3b2a00, #120c05);
  color: #ffd23f;
  font-size: 22px;
  font-weight: 900;
  box-shadow: 0 0 18px rgba(255, 196, 0, 0.35);
}
.evp-podium {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10px;
  border-radius: 12px 12px 0 0;
  background: linear-gradient(180deg, rgba(255, 210, 63, 0.25), rgba(255, 210, 63, 0.04));
  border: 1px solid rgba(255, 210, 63, 0.3);
  border-bottom: 0;
}
.evp-podium-1 {
  height: 110px;
}
.evp-podium-2 {
  height: 80px;
  background: linear-gradient(180deg, rgba(201, 209, 220, 0.22), rgba(201, 209, 220, 0.04));
  border-color: rgba(201, 209, 220, 0.3);
}
.evp-podium-3 {
  height: 60px;
  background: linear-gradient(180deg, rgba(224, 138, 74, 0.22), rgba(224, 138, 74, 0.04));
  border-color: rgba(224, 138, 74, 0.3);
}
.evp-me {
  position: relative;
  background: linear-gradient(90deg, rgba(255, 196, 0, 0.28), rgba(255, 196, 0, 0.08));
  box-shadow: inset 4px 0 0 #ffc21a;
}
.evp-pages {
  overflow: hidden;
  touch-action: pan-y;
}
.evp-pg {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.06);
}
.evp-pg:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
.evp-pg:disabled {
  opacity: 0.3;
}
.evp-pg-on {
  background: linear-gradient(180deg, #ffe680, #ffc21a);
  color: #3a2400;
}
.evp-pg-me {
  box-shadow: inset 0 0 0 2px #ffc21a;
  color: #ffd23f;
}
.evp-slide-in-next {
  animation: evp-in-next 0.22s ease-out;
}
.evp-slide-in-prev {
  animation: evp-in-prev 0.22s ease-out;
}
@keyframes evp-in-next {
  from {
    transform: translateX(28px);
  }
  to {
    transform: none;
  }
}
@keyframes evp-in-prev {
  from {
    transform: translateX(-28px);
  }
  to {
    transform: none;
  }
}
@keyframes evp-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes evp-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
@keyframes evp-bob-pixel {
  0%,
  100% {
    transform: translateY(0);
  }
  25%,
  75% {
    transform: translateY(-6px);
  }
  50% {
    transform: translateY(-12px);
  }
}
@keyframes evp-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-14px) rotate(40deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .evp-rays,
  .evp-confetti,
  .evp-trophy {
    animation: none;
  }
}
</style>

<style>
/* 이벤트 페이지는 화이트 테마에서도 필터 없이(theme-native) 그린다. theme-native는 사이트 전체의 흰 글씨/옅은 테두리를
   어두운 색으로 바꾸는 규칙이 있어서, 어두운 프로모션 화면 안(.evp)에서는 원래 색으로 되돌린다. */
html.theme-native .evp .text-white,
html.theme-native .evp .hover\:text-white:hover {
  color: #ffffff !important;
}
html.theme-native .evp .text-slate-100 {
  color: #f1f5f9 !important;
}
html.theme-native .evp .text-slate-200 {
  color: #e2e8f0 !important;
}
html.theme-native .evp .text-slate-300 {
  color: #cbd5e1 !important;
}
html.theme-native .evp .text-slate-400 {
  color: #94a3b8 !important;
}
html.theme-native .evp .text-slate-500 {
  color: #64748b !important;
}
html.theme-native .evp .bg-white\/10 {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
html.theme-native .evp .hover\:bg-white\/15:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
}
html.theme-native .evp .border-white\/10 {
  border-color: rgba(255, 255, 255, 0.1) !important;
}
html.theme-native .evp .border-white\/5 {
  border-color: rgba(255, 255, 255, 0.05) !important;
}
</style>
