<script setup lang="ts">
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

interface Props {
  modelValue?: string | null
  bucket?: string
  folder?: string
  maxSizeMB?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  bucket: 'products',
  folder: '',
  maxSizeMB: 5
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'uploaded': [url: string]
  'deleted': []
}>()

const { uploadFile, deleteFile, uploading } = useMediaUpload()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const imageUrl = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await processFile(target.files[0])
  }
  // Reset input so same file can be selected again
  target.value = ''
}

const processFile = async (file: File) => {
  const result = await uploadFile(file, props.bucket, props.folder, {
    maxSizeMB: props.maxSizeMB
  })

  if (result.error) {
    toast.error(result.error)
    return
  }

  if (result.url) {
    imageUrl.value = result.url
    emit('uploaded', result.url)
    toast.success('Image uploaded successfully')
  }
}

const handleRemove = async () => {
  if (!imageUrl.value) return

  const result = await deleteFile(imageUrl.value, props.bucket)
  
  if (result.error) {
    // Still remove from UI even if delete fails (might be external URL)
    console.warn('Could not delete from storage:', result.error)
  }

  imageUrl.value = null
  emit('deleted')
  toast.success('Image removed')
}

const triggerFileSelect = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div class="w-full">
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Image Preview -->
    <div v-if="imageUrl" class="relative group">
      <div class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <NuxtImg
          :src="imageUrl"
          alt="Uploaded image"
          loading="lazy"
          width="192"
          height="192"
          format="webp"
          class="w-full h-48 object-cover"
        />
        <!-- Overlay on hover -->
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            @click="triggerFileSelect"
          >
            <Upload class="h-4 w-4" />
            Replace
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 backdrop-blur-sm transition-colors hover:bg-rose-500/30"
            @click="handleRemove"
          >
            <X class="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </div>

    <!-- Drop Zone -->
    <div
      v-else
      class="relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300"
      :class="[
        isDragging 
          ? 'border-violet-500 bg-violet-500/10' 
          : 'border-white/20 bg-white/5 hover:border-violet-500/50 hover:bg-white/10',
        uploading ? 'pointer-events-none' : ''
      ]"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerFileSelect"
    >
      <div class="flex flex-col items-center justify-center py-8 px-4">
        <!-- Upload Icon / Loader -->
        <div 
          class="mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors"
          :class="isDragging ? 'bg-violet-500/20' : 'bg-white/10'"
        >
          <Loader2 v-if="uploading" class="h-6 w-6 text-violet-400 animate-spin" />
          <ImageIcon v-else class="h-6 w-6" :class="isDragging ? 'text-violet-400' : 'text-slate-400'" />
        </div>

        <!-- Text -->
        <p class="mb-1 text-sm font-medium" :class="isDragging ? 'text-violet-400' : 'text-white'">
          {{ uploading ? 'Uploading...' : isDragging ? 'Drop image here' : 'Drag & drop or click to upload' }}
        </p>
        <p class="text-xs text-slate-500">
          JPEG, PNG, WebP or GIF (max {{ maxSizeMB }}MB)
        </p>

        <!-- Glow effect when dragging -->
        <div 
          v-if="isDragging"
          class="absolute inset-0 rounded-xl bg-violet-500/5 blur-xl"
        />
      </div>
    </div>
  </div>
</template>
