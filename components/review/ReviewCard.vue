<script setup lang="ts">
import { ThumbsUp, CheckCircle, Pencil, Trash2, MessageSquare } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ReviewWithDetails } from '~/composables/useReviews'

const props = defineProps<{
  review: ReviewWithDetails
  isOwner?: boolean
}>()

const emit = defineEmits<{
  'vote-helpful': [reviewId: string]
  'edit': [review: ReviewWithDetails]
  'delete': [reviewId: string]
}>()

const user = useSupabaseUser()

// Format date
const formatDate = (date: string | null) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get reviewer display name
const reviewerName = computed(() => {
  return props.review.profiles?.full_name || 'Anonymous'
})

// Get avatar emoji (from avatar_id or default)
const avatarEmoji = computed(() => {
  return props.review.profiles?.avatar_id || '👤'
})
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
    <!-- Header: User info + Rating -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <!-- Avatar -->
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-lg">
          {{ avatarEmoji }}
        </div>
        
        <!-- Name + Date -->
        <div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-white">{{ reviewerName }}</span>
            
            <!-- Verified Purchase Badge -->
            <Badge 
              v-if="review.is_verified_purchase"
              variant="outline"
              class="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs"
            >
              <CheckCircle class="h-3 w-3" />
              Verified Purchase
            </Badge>
          </div>
          <span class="text-sm text-slate-400">{{ formatDate(review.created_at) }}</span>
        </div>
      </div>
      
      <!-- Star Rating -->
      <StarRating :rating="review.rating" size="sm" />
    </div>
    
    <!-- Review Title -->
    <h4 v-if="review.title" class="mt-4 font-semibold text-white">
      {{ review.title }}
    </h4>
    
    <!-- Review Comment -->
    <p class="mt-2 text-slate-300 leading-relaxed">
      {{ review.comment }}
    </p>
    
    <!-- Admin Response -->
    <div 
      v-if="review.review_responses?.length"
      class="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4"
    >
      <div class="flex items-center gap-2 text-sm text-violet-400 mb-2">
        <MessageSquare class="h-4 w-4" />
        <span class="font-medium">Response from {{ review.review_responses[0].profiles?.full_name || 'Team' }}</span>
      </div>
      <p class="text-slate-300 text-sm">
        {{ review.review_responses[0].response }}
      </p>
    </div>
    
    <!-- Actions -->
    <div class="mt-4 flex items-center justify-between">
      <!-- Helpful Vote Button -->
      <Button
        v-if="user && !isOwner"
        variant="ghost"
        size="sm"
        :class="[
          'gap-1.5',
          review.user_has_voted 
            ? 'text-violet-400 hover:text-violet-300' 
            : 'text-slate-400 hover:text-slate-300'
        ]"
        @click="emit('vote-helpful', review.id)"
      >
        <ThumbsUp :class="['h-4 w-4', review.user_has_voted ? 'fill-current' : '']" />
        <span>Helpful</span>
        <span v-if="(review.helpful_count || 0) > 0" class="text-xs">
          ({{ review.helpful_count }})
        </span>
      </Button>
      
      <span v-else-if="(review.helpful_count || 0) > 0" class="text-sm text-slate-400">
        {{ review.helpful_count }} {{ review.helpful_count === 1 ? 'person' : 'people' }} found this helpful
      </span>
      
      <div v-else />
      
      <!-- Owner Actions -->
      <div v-if="isOwner" class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="gap-1.5 text-slate-400 hover:text-white"
          @click="emit('edit', review)"
        >
          <Pencil class="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="gap-1.5 text-slate-400 hover:text-rose-400"
          @click="emit('delete', review.id)"
        >
          <Trash2 class="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  </div>
</template>
