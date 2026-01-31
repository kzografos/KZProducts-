<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, AlertCircle } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  initialRating?: number
  initialTitle?: string
  initialComment?: string
  isEditing?: boolean
  loading?: boolean
}>(), {
  initialRating: 0,
  initialTitle: '',
  initialComment: '',
  isEditing: false,
  loading: false
})

const emit = defineEmits<{
  'submit': [data: { rating: number; title: string; comment: string }]
  'cancel': []
}>()

const rating = ref(props.initialRating)
const title = ref(props.initialTitle)
const comment = ref(props.initialComment)

const MIN_COMMENT_LENGTH = 10
const MAX_COMMENT_LENGTH = 500

const commentLength = computed(() => comment.value.length)
const isCommentValid = computed(() => commentLength.value >= MIN_COMMENT_LENGTH && commentLength.value <= MAX_COMMENT_LENGTH)
const isRatingValid = computed(() => rating.value >= 1)
const isFormValid = computed(() => isRatingValid.value && isCommentValid.value)

const validationErrors = computed(() => {
  const errors: string[] = []
  if (!isRatingValid.value) errors.push('Select a rating')
  if (commentLength.value < MIN_COMMENT_LENGTH) errors.push(`Write at least ${MIN_COMMENT_LENGTH} characters`)
  return errors
})

const handleSubmit = () => {
  if (!isFormValid.value) return
  
  emit('submit', {
    rating: rating.value,
    title: title.value.trim(),
    comment: comment.value.trim()
  })
}

// Reset form when initial values change (for editing)
watch(() => props.initialRating, (val) => { rating.value = val })
watch(() => props.initialTitle, (val) => { title.value = val })
watch(() => props.initialComment, (val) => { comment.value = val })
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Star Rating -->
    <div class="space-y-2">
      <Label class="text-white">Your Rating *</Label>
      <StarRatingInput v-model="rating" size="lg" :disabled="loading" />
    </div>
    
    <!-- Title (Optional) -->
    <div class="space-y-2">
      <Label for="review-title" class="text-white">
        Review Title 
        <span class="text-slate-400 font-normal">(optional)</span>
      </Label>
      <Input
        id="review-title"
        v-model="title"
        :disabled="loading"
        placeholder="Summarize your experience"
        maxlength="100"
        class="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
      />
    </div>
    
    <!-- Comment -->
    <div class="space-y-2">
      <Label for="review-comment" class="text-white">Your Review *</Label>
      <Textarea
        id="review-comment"
        v-model="comment"
        :disabled="loading"
        :placeholder="`Share your experience with this product (minimum ${MIN_COMMENT_LENGTH} characters)`"
        rows="5"
        :maxlength="MAX_COMMENT_LENGTH"
        class="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
      />
      <div class="flex justify-between text-sm">
        <span 
          :class="[
            'transition-colors',
            commentLength < MIN_COMMENT_LENGTH ? 'text-amber-400' : 
            commentLength > 450 ? 'text-amber-400' : 'text-slate-400'
          ]"
        >
          {{ commentLength }}/{{ MAX_COMMENT_LENGTH }} characters
          <span v-if="commentLength < MIN_COMMENT_LENGTH" class="text-slate-500">
            ({{ MIN_COMMENT_LENGTH - commentLength }} more needed)
          </span>
        </span>
      </div>
    </div>
    
    <!-- Validation Errors -->
    <div v-if="validationErrors.length > 0" class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <AlertCircle class="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
      <div class="text-sm text-amber-300">
        <span class="font-medium">To submit your review:</span>
        <ul class="mt-1 list-disc list-inside text-amber-400/80">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-2">
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-white/20 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="!isFormValid || loading"
        :class="[
          'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-all disabled:cursor-not-allowed',
          isFormValid && !loading 
            ? 'bg-violet-600 hover:bg-violet-500' 
            : 'bg-slate-600 opacity-50'
        ]"
        @click.prevent="handleSubmit"
      >
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isEditing ? 'Update Review' : 'Submit Review' }}
      </button>
    </div>
  </form>
</template>
