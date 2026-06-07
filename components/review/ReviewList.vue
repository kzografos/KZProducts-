<script setup lang="ts">
import { Loader2, MessageSquarePlus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ReviewWithDetails, ReviewSortOption } from '~/composables/useReviews'

const props = defineProps<{
  reviews: ReviewWithDetails[]
  loading?: boolean
  hasMore?: boolean
}>()

const emit = defineEmits<{
  'sort-change': [sort: ReviewSortOption]
  'load-more': []
  'write-review': []
  'vote-helpful': [reviewId: string]
  'edit-review': [review: ReviewWithDetails]
  'delete-review': [reviewId: string]
}>()

const user = useSupabaseUser()
const sortOption = ref<ReviewSortOption>('recent')

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
  { value: 'helpful', label: 'Most Helpful' }
]

const handleSortChange = (value: unknown) => {
  if (typeof value !== 'string') return
  const validOptions: ReviewSortOption[] = ['recent', 'highest', 'lowest', 'helpful']
  if (validOptions.includes(value as ReviewSortOption)) {
    sortOption.value = value as ReviewSortOption
    emit('sort-change', value as ReviewSortOption)
  }
}

// Check if a review belongs to current user
const isReviewOwner = (review: ReviewWithDetails) => {
  return user.value?.id === review.user_id
}
</script>

<template>
  <div class="space-y-6 overflow-x-clip">
    <!-- Header -->
    <div class="flex items-center justify-end">
        <!-- Sort Dropdown -->
        <Select :model-value="sortOption" @update:model-value="handleSortChange">
          <SelectTrigger class="w-full max-w-[160px] border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent class="w-[160px] max-w-[calc(100vw-2rem)]">
            <SelectItem 
              v-for="option in sortOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading && reviews.length === 0" class="space-y-4 overflow-hidden">
      <div 
        v-for="i in 3" 
        :key="i" 
        class="p-5 rounded-xl border animate-pulse border-white/10 bg-white/5"
      >
        <div class="flex gap-3 items-center">
          <div class="w-10 h-10 rounded-full bg-white/10" />
          <div class="space-y-2">
            <div class="w-24 h-4 rounded bg-white/10" />
            <div class="w-16 h-3 rounded bg-white/10" />
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <div class="w-full h-3 rounded bg-white/10" />
          <div class="w-3/4 h-3 rounded bg-white/10" />
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div 
      v-else-if="reviews.length === 0" 
      class="p-8 text-center rounded-xl border backdrop-blur-sm border-white/10 bg-white/5"
    >
      <MessageSquarePlus class="mx-auto w-12 h-12 text-slate-600" />
      <h4 class="mt-4 font-medium text-white">No reviews yet</h4>
      <p class="mt-1 text-sm text-slate-400">
        Be the first to share your thoughts on this product
      </p>
      <p v-if="!user" class="mt-4 text-sm text-slate-500">
        <NuxtLink to="/login" class="text-violet-400 hover:text-violet-300">Sign in</NuxtLink>
        to write a review
      </p>
    </div>
    
    <!-- Reviews List -->
    <div v-else class="space-y-4 overflow-hidden">
      <ReviewCard
        v-for="review in reviews"
        :key="review.id"
        :review="review"
        :is-owner="isReviewOwner(review)"
        @vote-helpful="emit('vote-helpful', $event)"
        @edit="emit('edit-review', $event)"
        @delete="emit('delete-review', $event)"
      />
      
      <!-- Load More Button -->
      <div v-if="hasMore" class="pt-4 text-center">
        <Button
          variant="outline"
          :disabled="loading"
          class="border-white/10 text-slate-300 hover:bg-white/5"
          @click="emit('load-more')"
        >
          <Loader2 v-if="loading" class="mr-2 w-4 h-4 animate-spin" />
          {{ loading ? 'Loading...' : 'Load More Reviews' }}
        </Button>
      </div>
    </div>
  </div>
</template>
