<template>
  <!-- 이벤트 첫 화면 픽셀아트(어셋 1~10). 1 = 트로피(PixelTrophy), 2~10 = utils/pixelAssets.ts 의 글자 그림 -->
  <PixelTrophy v-if="art === null" />
  <svg v-else :viewBox="`0 0 ${art.width} ${art.height}`" preserveAspectRatio="xMidYMax meet" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path v-for="(p, i) in art.paths" :key="i" :fill="p.fill" :d="p.d" />
  </svg>
</template>

<script setup lang="ts">
import { PIXEL_ASSETS, pixelArtPaths } from '~/utils/pixelAssets'

const props = defineProps<{ asset?: number | string | null }>()
const art = computed(() => {
  const n = Number(props.asset) || 1
  const a = PIXEL_ASSETS[n]
  return a ? pixelArtPaths(a) : null
})
</script>
