<script setup lang="ts">
import { Heart } from 'lucide-vue-next'

const props = defineProps<{
  productId: string
}>()

const { isInWishlist, toggleWishlist } = useWishlist()
const loading = ref(false)

const inWishlist = computed(() => isInWishlist(props.productId))

const handleClick = async (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  
  loading.value = true
  await toggleWishlist(props.productId)
  loading.value = false
}
</script>

<template>
  <button
    @click="handleClick"
    :disabled="loading"
    class="group/heart flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:bg-black/60 hover:border-white/20 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="{ 'animate-pulse': loading }"
    :aria-label="inWishlist ? 'Remove from favorites' : 'Add to favorites'"
  >
    <Heart
      class="w-4 h-4 transition-all duration-200"
      :class="[
        inWishlist 
          ? 'fill-red-500 text-red-500' 
          : 'text-white/80 group-hover/heart:text-red-400'
      ]"
    />
  </button>
</template>
