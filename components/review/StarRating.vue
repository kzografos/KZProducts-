<script setup lang="ts">
import { Star } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  maxStars?: number
}>(), {
  size: 'md',
  showValue: false,
  maxStars: 5
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-3.5 h-3.5'
    case 'lg': return 'w-6 h-6'
    default: return 'w-4 h-4'
  }
})

const textSizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-xs'
    case 'lg': return 'text-base'
    default: return 'text-sm'
  }
})

// Generate array for star rendering
const stars = computed(() => {
  return Array.from({ length: props.maxStars }, (_, i) => {
    const starIndex = i + 1
    const filled = props.rating >= starIndex
    const halfFilled = !filled && props.rating > starIndex - 1 && props.rating < starIndex
    return { filled, halfFilled }
  })
})
</script>

<template>
  <div class="flex items-center gap-0.5">
    <div v-for="(star, i) in stars" :key="i" class="relative">
      <!-- Empty star (background) -->
      <Star 
        :class="[sizeClasses, 'text-slate-400/30']"
        :stroke-width="1.5"
      />
      
      <!-- Filled star (overlay) -->
      <Star 
        v-if="star.filled"
        :class="[sizeClasses, 'text-violet-500 fill-violet-500 absolute inset-0']"
        :stroke-width="1.5"
      />
      
      <!-- Half-filled star (overlay with clip) -->
      <div 
        v-else-if="star.halfFilled"
        class="absolute inset-0 overflow-hidden"
        :style="{ width: `${(rating - Math.floor(rating)) * 100}%` }"
      >
        <Star 
          :class="[sizeClasses, 'text-violet-500 fill-violet-500']"
          :stroke-width="1.5"
        />
      </div>
    </div>
    
    <!-- Numeric value -->
    <span v-if="showValue" :class="['ml-1.5 font-medium text-foreground', textSizeClass]">
      {{ rating.toFixed(1) }}
    </span>
  </div>
</template>
