<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Database } from '~/types/database.types'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']

interface Props {
  open: boolean
  category?: Category | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const client = useSupabaseClient<Database>()

// Form state
const loading = ref(false)
const form = ref<CategoryInsert>({
  name: '',
  slug: '',
  description: '',
  image_url: ''
})

// Reset form
const resetForm = () => {
  form.value = {
    name: '',
    slug: '',
    description: '',
    image_url: ''
  }
}

// Watch for category changes
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    form.value = {
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description || '',
      image_url: newCategory.image_url || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Generate slug from name
const generateSlug = () => {
  form.value.slug = form.value.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Save category
const handleSave = async () => {
  if (!form.value.name || !form.value.slug) {
    toast.error('Please fill in all required fields')
    return
  }

  loading.value = true
  try {
    if (props.category) {
      // Update existing
      const { error } = await client
        .from('categories')
        .update(form.value)
        .eq('id', props.category.id)
      
      if (error) throw error
      toast.success('Category updated successfully')
    } else {
      // Create new
      const { error } = await client
        .from('categories')
        .insert(form.value)
      
      if (error) throw error
      toast.success('Category created successfully')
    }
    
    emit('saved')
    emit('update:open', false)
    resetForm()
  } catch (error: any) {
    console.error('Save error:', error)
    toast.error(error.message || 'Failed to save category')
  } finally {
    loading.value = false
  }
}

// Close drawer
const handleClose = () => {
  emit('update:open', false)
  resetForm()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        @click="handleClose"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300"
      leave-active-class="transition-transform duration-300"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="open"
        class="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-slate-950 shadow-2xl"
      >
        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
          <h2 class="text-lg font-semibold text-white">
            {{ category ? 'Edit Category' : 'New Category' }}
          </h2>
          <button
            class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            @click="handleClose"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Form -->
        <form class="p-6" @submit.prevent="handleSave">
          <div class="space-y-6">
            <!-- Name -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-300">
                Category Name *
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="e.g., Graphics Cards"
                @blur="!category && generateSlug()"
              />
            </div>

            <!-- Slug -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-300">
                URL Slug *
              </label>
              <input
                v-model="form.slug"
                type="text"
                class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="graphics-cards"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-300">
                Description
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Brief description of this category"
              />
            </div>

            <!-- Image URL -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-300">
                Image URL
              </label>
              <input
                v-model="form.image_url"
                type="url"
                class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="https://example.com/image.jpg"
              />
              <!-- Preview -->
              <div v-if="form.image_url" class="mt-3">
                <NuxtImg
                  :src="form.image_url"
                  alt="Category preview"
                  loading="lazy"
                  width="96"
                  height="96"
                  format="webp"
                  class="h-24 w-24 rounded-lg object-cover"
                  @error="form.image_url = ''"
                />
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-8 flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-3 font-medium text-white transition-colors hover:bg-white/5"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 rounded-xl bg-violet-500 px-4 py-3 font-medium text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category') }}
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>
