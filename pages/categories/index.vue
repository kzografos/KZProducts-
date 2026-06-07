<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import type { Database } from '~/types/database.types'

const client = useSupabaseClient<Database>()
type CategoryListItem = Pick<
  Database['public']['Tables']['categories']['Row'],
  'id' | 'name' | 'slug' | 'description' | 'image_url'
>

const categories = ref<CategoryListItem[]>([])
const loading = ref(true)

onMounted(async () => {
    const { data } = await client.from('categories').select('id, name, slug, description, image_url').order('sort_order', { ascending: true })
    if (data) categories.value = data as CategoryListItem[]
    loading.value = false
})
</script>

<template>
  <div class="container py-8">
     <h1 class="text-3xl font-bold mb-8">Shop by Category</h1>

     <div v-if="loading" class="flex justify-center py-20">
        <Loader2 class="h-10 w-10 animate-spin text-primary" />
     </div>

     <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink v-for="cat in categories" :key="cat.id" :to="`/categories/${cat.slug}`" class="group relative overflow-hidden rounded-lg aspect-video border bg-muted">
           <NuxtImg 
            v-if="cat.image_url" 
            :src="cat.image_url" 
            :alt="cat.name"
            loading="lazy"
            format="webp"
            quality="80"
            class="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
           />
           <div v-else class="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
             No Image
           </div>
           
           <div class="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors group-hover:bg-black/50">
              <h2 class="text-2xl font-bold text-white tracking-wider">{{ cat.name }}</h2>
           </div>
        </NuxtLink>
     </div>
  </div>
</template>
