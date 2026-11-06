<template>
  <!-- 상단 오른쪽 사람 아이콘: 누르면 아이디 / 내 정보 / 로그아웃 메뉴가 서서히(페이드) 나타나고,
       아이콘을 다시 누르거나 메뉴 바깥을 누르면 서서히 사라진다. 다른 화면으로 가거나 새로고침해도 닫힌다. -->
  <div ref="rootEl" class="relative">
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
      :aria-label="t('내 계정', 'My account')"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg viewBox="0 0 24 24" class="h-[21px] w-[21px]" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" />
        <circle cx="12" cy="10" r="3.2" />
        <path d="M6.2 18.6c1.3-2.3 3.4-3.6 5.8-3.6s4.5 1.3 5.8 3.6" />
      </svg>
    </button>
    <Transition name="user-menu-fade">
    <div v-show="open" class="absolute right-0 top-full z-50 pt-2">
      <!-- 폭: 예전 180px에서 30% 줄인 126px -->
      <div class="w-[126px] rounded-xl border border-cyan-500/10 bg-[#03101d] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
        <div class="truncate px-3 pb-2 pt-1 text-center text-[16px] font-bold text-white">{{ me?.username }}</div>
        <div class="mx-1 mb-1 h-px bg-white/10" />
        <NuxtLink
          to="/profile"
          class="block rounded-lg px-3 py-2 text-center text-[15px] text-slate-200 hover:bg-cyan-400/10 hover:text-white"
          @click="go('/profile')"
        >
          {{ t('내 정보', 'My Info') }}
        </NuxtLink>
        <button
          type="button"
          class="block w-full rounded-lg px-3 py-2 text-center text-[15px] text-slate-200 hover:bg-cyan-400/10 hover:text-white"
          @click="onLogout"
        >
          {{ t('로그아웃', 'Log Out') }}
        </button>
      </div>
    </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'navigate', to: string): void; (e: 'logout'): void }>()
const { t } = useLocale()
const { me } = useMe()
const open = ref(false)
const route = useRoute()
// 다른 화면으로 옮기면 메뉴를 닫는다.
watch(
  () => route.fullPath,
  () => {
    open.value = false
  }
)
function go(to: string) {
  open.value = false
  emit('navigate', to)
}
function onLogout() {
  open.value = false
  emit('logout')
}

// 메뉴 바깥(화면의 다른 곳)을 누르면 닫는다.
const rootEl = ref<HTMLElement | null>(null)
function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  const el = rootEl.value
  if (el && e.target instanceof Node && el.contains(e.target)) return
  open.value = false
}
onMounted(() => document.addEventListener('pointerdown', onDocPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointerDown))
</script>

<style scoped>
.user-menu-fade-enter-active,
.user-menu-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.user-menu-fade-enter-from,
.user-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
