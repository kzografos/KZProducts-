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

const formatDate = (date: string | null) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const reviewerName = computed(() => {
  return props.review.profiles?.full_name || 'Anonymous'
})

const avatarDisplay = computed(() => {
  const avatarId = props.review.profiles?.avatar_id?.trim()

  if (avatarId && !/^[\w-]+$/i.test(avatarId)) {
    return avatarId
  }

  const name = reviewerName.value.trim()
  return name ? name.charAt(0).toUpperCase() : 'A'
})
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">
          <span class="leading-none">{{ avatarDisplay }}</span>
        </div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="truncate font-medium text-white">{{ reviewerName }}</span>

            <Badge
              v-if="review.is_verified_purchase"
              variant="outline"
              class="gap-1 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400"
            >
              <CheckCircle class="h-3 w-3" />
              Verified Purchase
            </Badge>
          </div>
          <span class="text-sm text-slate-400">{{ formatDate(review.created_at) }}</span>
        </div>
      </div>

      <div class="shrink-0 self-start">
        <StarRating :rating="review.rating" size="sm" />
      </div>
    </div>

    <h4 v-if="review.title" class="mt-4 font-semibold text-white">
      {{ review.title }}
    </h4>

    <p class="mt-2 leading-relaxed text-slate-300">
      {{ review.comment }}
    </p>

    <div
      v-if="review.review_responses?.length"
      class="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4"
    >
      <div class="mb-2 flex items-center gap-2 text-sm text-violet-400">
        <MessageSquare class="h-4 w-4" />
        <span class="font-medium">Response from {{ review.review_responses[0].profiles?.full_name || 'Team' }}</span>
      </div>
      <p class="text-sm text-slate-300">
        {{ review.review_responses[0].response }}
      </p>
    </div>

    <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button
        v-if="user && !isOwner"
        variant="ghost"
        size="sm"
        :class="[
          'gap-1.5',
          review.user_has_voted
            ? 'text-violet-400 hover:text-violet-300'
            : 'text-slate-400 hover:text-slate-300',
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

      <div v-if="isOwner" class="flex flex-wrap items-center gap-2 sm:justify-end">
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
