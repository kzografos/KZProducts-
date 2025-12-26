<script setup lang="ts">
import { Cpu, MonitorSpeaker, MemoryStick, HardDrive, Loader2 } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Database } from '~/types/database.types'

const client = useSupabaseClient<Database>()

// Category icon mapping
const categoryIcons: Record<string, any> = {
  cpu: Cpu,
  gpu: MonitorSpeaker,
  ram: MemoryStick,
  ssd: HardDrive,
  storage: HardDrive,
}

// Category gradient mapping
const categoryGradients: Record<string, string> = {
  cpu: 'from-blue-600/20 to-cyan-600/20',
  gpu: 'from-purple-600/20 to-pink-600/20',
  ram: 'from-green-600/20 to-emerald-600/20',
  ssd: 'from-orange-600/20 to-amber-600/20',
  storage: 'from-orange-600/20 to-amber-600/20',
}

const categoryIconColors: Record<string, string> = {
  cpu: 'text-blue-500',
  gpu: 'text-purple-500',
  ram: 'text-green-500',
  ssd: 'text-orange-500',
  storage: 'text-orange-500',
}

const categories = ref<Database['public']['Tables']['categories']['Row'][]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .limit(4)
  
  if (data) categories.value = data
  loading.value = false
})

const getIcon = (slug: string) => categoryIcons[slug] || Cpu
const getGradient = (slug: string) => categoryGradients[slug] || 'from-gray-600/20 to-slate-600/20'
const getIconColor = (slug: string) => categoryIconColors[slug] || 'text-gray-500'
</script>

<template>
  <section class="py-16">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold tracking-tight mb-4">Shop by Category</h2>
      <p class="text-muted-foreground max-w-2xl mx-auto">
        Browse our extensive collection of premium PC components
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <NuxtLink 
        v-for="category in categories" 
        :key="category.id"
        :to="`/categories/${category.slug}`"
        class="group"
      >
        <Card class="h-full overflow-hidden border-0 bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10"
              :class="getGradient(category.slug)">
          <CardHeader class="pb-4">
            <div class="w-14 h-14 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <component 
                :is="getIcon(category.slug)" 
                class="w-7 h-7 transition-colors"
                :class="getIconColor(category.slug)"
              />
            </div>
            <CardTitle class="text-xl group-hover:text-primary transition-colors">
              {{ category.name }}
            </CardTitle>
            <CardDescription v-if="category.description" class="line-clamp-2">
              {{ category.description }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
              <span>Browse products</span>
              <svg 
                class="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </NuxtLink>
    </div>

    <div class="text-center mt-10">
      <NuxtLink 
        to="/categories" 
        class="inline-flex items-center text-primary hover:underline font-medium"
      >
        View all categories
        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>
  </section>
</template>
