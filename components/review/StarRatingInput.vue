<script setup lang="ts">
import { Star } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>(), {
  size: 'md',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverRating = ref(0)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-5 h-5'
    case 'lg': return 'w-8 h-8'
    default: return 'w-6 h-6'
  }
})

const ratingLabels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent']

const currentLabel = computed(() => {
  const rating = hoverRating.value || props.modelValue
  return rating > 0 ? ratingLabels[rating - 1] : 'Select rating'
})

const handleClick = (rating: number) => {
  if (!props.disabled) {
    emit('update:modelValue', rating)
  }
}

const handleMouseEnter = (rating: number) => {
  if (!props.disabled) {
    hoverRating.value = rating
  }
}

const handleMouseLeave = () => {
  hoverRating.value = 0
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div 
      class="flex items-center gap-1"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
      @mouseleave="handleMouseLeave"
    >
      <button
        v-for="i in 5"
        :key="i"
        type="button"
        :disabled="disabled"
        class="relative p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
        :class="{ 'cursor-pointer': !disabled }"
        @click="handleClick(i)"
        @mouseenter="handleMouseEnter(i)"
      >
        <!-- Empty star -->
        <Star 
          :class="[
            sizeClasses,
            'transition-colors duration-150',
            (hoverRating >= i || (!hoverRating && modelValue >= i))
              ? 'text-violet-500 fill-violet-500'
              : 'text-slate-400/50'
          ]"
          :stroke-width="1.5"
        />
      </button>
    </div>
    
    <!-- Rating label -->
    <span 
      class="text-sm transition-colors"
      :class="(hoverRating || modelValue) ? 'text-violet-400' : 'text-slate-500'"
    >
      {{ currentLabel }}
    </span>
  </div>
</template>
