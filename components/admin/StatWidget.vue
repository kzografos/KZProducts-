<script setup lang="ts">
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-vue-next'

interface Props {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  iconColor?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'bg-violet-500/20 text-violet-400',
  loading: false
})

const isPositive = computed(() => (props.change ?? 0) >= 0)
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.07]">
    <!-- Loading state -->
    <div v-if="loading" class="animate-pulse">
      <div class="mb-4 flex items-center justify-between">
        <div class="h-4 w-24 rounded bg-white/10" />
        <div class="h-10 w-10 rounded-xl bg-white/10" />
      </div>
      <div class="h-8 w-32 rounded bg-white/10" />
      <div class="mt-2 h-4 w-20 rounded bg-white/10" />
    </div>

    <!-- Content -->
    <div v-else>
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm font-medium text-slate-400">{{ title }}</p>
        <div
          v-if="icon"
          :class="['flex h-10 w-10 items-center justify-center rounded-xl', iconColor]"
        >
          <component :is="icon" class="h-5 w-5" />
        </div>
      </div>

      <p class="text-3xl font-bold text-white">{{ value }}</p>

      <div v-if="change !== undefined" class="mt-2 flex items-center gap-1.5">
        <span
          :class="[
            'flex items-center gap-0.5 text-sm font-medium',
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          ]"
        >
          <TrendingUp v-if="isPositive" class="h-4 w-4" />
          <TrendingDown v-else class="h-4 w-4" />
          {{ Math.abs(change) }}%
        </span>
        <span v-if="changeLabel" class="text-sm text-slate-500">
          {{ changeLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
