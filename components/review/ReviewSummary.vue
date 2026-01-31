<script setup lang="ts">
import type { ReviewStats } from '~/composables/useReviews'

const props = defineProps<{
  stats: ReviewStats | null
  loading?: boolean
}>()

// Calculate percentage for each rating
const ratingPercentages = computed(() => {
  if (!props.stats || props.stats.total_reviews === 0) {
    return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  }
  
  const total = props.stats.total_reviews
  return {
    5: Math.round((props.stats.rating_5 / total) * 100),
    4: Math.round((props.stats.rating_4 / total) * 100),
    3: Math.round((props.stats.rating_3 / total) * 100),
    2: Math.round((props.stats.rating_2 / total) * 100),
    1: Math.round((props.stats.rating_1 / total) * 100)
  }
})

const ratingCounts = computed(() => {
  if (!props.stats) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  return {
    5: props.stats.rating_5,
    4: props.stats.rating_4,
    3: props.stats.rating_3,
    2: props.stats.rating_2,
    1: props.stats.rating_1
  }
})
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="flex items-center gap-4">
        <div class="h-16 w-16 rounded-xl bg-white/10" />
        <div class="space-y-2">
          <div class="h-5 w-24 rounded bg-white/10" />
          <div class="h-4 w-16 rounded bg-white/10" />
        </div>
      </div>
      <div class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-3 rounded bg-white/10" />
      </div>
    </div>
    
    <!-- Content -->
    <template v-else-if="stats">
      <div class="flex flex-col sm:flex-row sm:items-start gap-6">
        <!-- Overall Rating -->
        <div class="flex items-center gap-4">
          <div class="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-500/20">
            <span class="text-3xl font-bold text-violet-400">
              {{ stats.average_rating.toFixed(1) }}
            </span>
          </div>
          <div>
            <StarRating :rating="stats.average_rating" size="md" />
            <p class="mt-1 text-sm text-slate-400">
              {{ stats.total_reviews.toLocaleString() }} 
              {{ stats.total_reviews === 1 ? 'review' : 'reviews' }}
            </p>
          </div>
        </div>
        
        <!-- Rating Distribution -->
        <div class="flex-1 space-y-2">
          <div 
            v-for="rating in [5, 4, 3, 2, 1]" 
            :key="rating"
            class="flex items-center gap-3"
          >
            <span class="w-3 text-sm text-slate-400">{{ rating }}</span>
            <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                class="h-full rounded-full bg-violet-500 transition-all duration-500"
                :style="{ width: `${ratingPercentages[rating as keyof typeof ratingPercentages]}%` }"
              />
            </div>
            <span class="w-8 text-right text-sm text-slate-400">
              {{ ratingCounts[rating as keyof typeof ratingCounts] }}
            </span>
          </div>
        </div>
      </div>
    </template>
    
    <!-- No Reviews -->
    <div v-else class="text-center py-4">
      <p class="text-slate-400">No reviews yet</p>
      <p class="text-sm text-slate-500 mt-1">Be the first to review this product!</p>
    </div>
  </div>
</template>
