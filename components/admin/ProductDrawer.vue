<script setup lang="ts">
import { X, Upload, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Database } from '~/types/database.types'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']

interface Props {
  open: boolean
  product?: Product | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const client = useSupabaseClient<Database>()

// Form state
const loading = ref(false)
const form = ref<ProductInsert>({
  name: '',
  slug: '',
  description: '',
  price: 0,
  compare_at_price: null,
  stock_quantity: 0,
  category_id: null,
  images: [],
  is_active: true
})

// Categories for dropdown
const categories = ref<{ id: string; name: string }[]>([])

// Reset form - MUST be defined before watch that uses it
const resetForm = () => {
  form.value = {
    name: '',
    slug: '',
    description: '',
    price: 0,
    compare_at_price: null,
    stock_quantity: 0,
    category_id: null,
    images: [],
    is_active: true
  }
}

// Watch for product changes OR drawer opening
watch([() => props.product, () => props.open], ([newProduct, isOpen]) => {
  if (isOpen && newProduct) {
    form.value = {
      name: newProduct.name,
      slug: newProduct.slug,
      description: newProduct.description || '',
      price: newProduct.price,
      compare_at_price: newProduct.compare_at_price,
      stock_quantity: newProduct.stock_quantity || 0,
      category_id: newProduct.category_id,
      images: newProduct.images || [],
      is_active: newProduct.is_active ?? true
    }
  } else if (isOpen && !newProduct) {
    // New product mode
    resetForm()
  }
}, { immediate: true })

// Fetch categories
const fetchCategories = async () => {
  const { data } = await client
    .from('categories')
    .select('id, name')
    .order('name')
  
  categories.value = data || []
}

// Generate slug from name
const generateSlug = () => {
  form.value.slug = form.value.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Primary image (first in array)
const primaryImage = computed({
  get: () => form.value.images?.[0] || null,
  set: (value: string | null) => {
    if (value) {
      form.value.images = [value, ...(form.value.images?.slice(1) || [])]
    } else {
      form.value.images = form.value.images?.slice(1) || []
    }
  }
})

// Handle image uploaded
const handleImageUploaded = (url: string) => {
  // Primary image is set via v-model, just ensure array exists
  if (!form.value.images) {
    form.value.images = []
  }
}

// Handle image deleted
const handleImageDeleted = () => {
  // Primary image removed via v-model
}

// Remove image by index
const removeImage = (index: number) => {
  form.value.images = form.value.images?.filter((_, i) => i !== index) || []
}

// Save product
const handleSave = async () => {
  if (!form.value.name || !form.value.slug || form.value.price <= 0) {
    toast.error('Please fill in all required fields')
    return
  }

  loading.value = true
  try {
    if (props.product) {
      // Update existing
      const { error } = await client
        .from('products')
        .update(form.value)
        .eq('id', props.product.id)
      
      if (error) throw error
      toast.success('Product updated successfully')
    } else {
      // Create new
      const { error } = await client
        .from('products')
        .insert(form.value)
      
      if (error) throw error
      toast.success('Product created successfully')
    }
    
    emit('saved')
    emit('update:open', false)
    resetForm()
  } catch (error: any) {
    console.error('Save error:', error)
    toast.error(error.message || 'Failed to save product')
  } finally {
    loading.value = false
  }
}

// Close drawer
const handleClose = () => {
  emit('update:open', false)
  resetForm()
}

onMounted(() => {
  fetchCategories()
})
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
        class="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-slate-950 shadow-2xl"
      >
        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
          <h2 class="text-lg font-semibold text-white">
            {{ product ? 'Edit Product' : 'New Product' }}
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
                Product Name *
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Enter product name"
                @blur="!product && generateSlug()"
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
                placeholder="product-url-slug"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-300">
                Description
              </label>
              <textarea
                v-model="form.description"
                rows="4"
                class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                placeholder="Enter product description"
              />
            </div>

            <!-- Price row -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-300">
                  Price (€) *
                </label>
                <input
                  v-model.number="form.price"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-300">
                  Compare at Price (€)
                </label>
                <input
                  v-model.number="form.compare_at_price"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  placeholder="0.00"
                />
              </div>
            </div>

            <!-- Stock & Category row -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-300">
                  Stock Quantity
                </label>
                <input
                  v-model.number="form.stock_quantity"
                  type="number"
                  min="0"
                  class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-300">
                  Category
                </label>
                <select
                  v-model="form.category_id"
                  class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                >
                  <option :value="null" class="bg-slate-900">No category</option>
                  <option
                    v-for="cat in categories"
                    :key="cat.id"
                    :value="cat.id"
                    class="bg-slate-900"
                  >
                    {{ cat.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Active toggle -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                :class="[
                  'relative h-6 w-11 rounded-full transition-colors',
                  form.is_active ? 'bg-violet-500' : 'bg-slate-700'
                ]"
                @click="form.is_active = !form.is_active"
              >
                <span
                  :class="[
                    'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    form.is_active ? 'translate-x-5' : 'translate-x-0'
                  ]"
                />
              </button>
              <span class="text-sm text-slate-300">Active</span>
            </div>

            <!-- Images -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-300">
                Product Image
              </label>
              
              <!-- Primary image uploader -->
              <AdminImageUploader
                v-model="primaryImage"
                bucket="products"
                :folder="form.slug || 'uploads'"
                @uploaded="handleImageUploaded"
                @deleted="handleImageDeleted"
              />

              <!-- Additional image URLs (optional) -->
              <div v-if="form.images && form.images.length > 1" class="mt-4">
                <p class="mb-2 text-xs text-slate-500">Additional images ({{ form.images.length - 1 }})</p>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="(img, idx) in form.images.slice(1)"
                    :key="idx"
                    class="relative group"
                  >
                    <NuxtImg
                      :src="img"
                      :alt="`Image ${idx + 2}`"
                      loading="lazy"
                      width="64"
                      height="64"
                      format="webp"
                      class="h-16 w-16 rounded-lg object-cover border border-white/10"
                    />
                    <button
                      type="button"
                      class="absolute -top-2 -right-2 rounded-full bg-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      @click="removeImage(idx + 1)"
                    >
                      <X class="h-3 w-3 text-white" />
                    </button>
                  </div>
                </div>
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
              {{ loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product') }}
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>
