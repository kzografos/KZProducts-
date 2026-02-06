<script setup lang="ts">
import { Cpu, MonitorSpeaker, MemoryStick, HardDrive, Loader2, ArrowRight } from 'lucide-vue-next'
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

// Category gradient mapping for icon backgrounds
const categoryIconColors: Record<string, string> = {
  cpu: 'bg-blue-500/20 text-blue-400',
  gpu: 'bg-violet-500/20 text-violet-400',
  ram: 'bg-emerald-500/20 text-emerald-400',
  ssd: 'bg-amber-500/20 text-amber-400',
  storage: 'bg-amber-500/20 text-amber-400',
}

const categories = ref<Database['public']['Tables']['categories']['Row'][]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await client
    .from('categories')
    .select('id, name, slug, description')
    .order('sort_order', { ascending: true })
    .limit(4)
  
  if (data) categories.value = data
  loading.value = false
})

const getIcon = (slug: string) => categoryIcons[slug] || Cpu
const getIconColor = (slug: string) => categoryIconColors[slug] || 'bg-slate-500/20 text-slate-400'
</script>

<template>
  <section class="py-16">
    <!-- Section Header -->
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold tracking-tight text-white mb-4">Shop by Category</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">
        Browse our extensive collection of premium PC components
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-violet-500" />
    </div>

    <!-- Category Cards Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <NuxtLink 
        v-for="category in categories" 
        :key="category.id"
        :to="`/categories/${category.slug}`"
        class="group"
      >
        <!-- Glassmorphism Card -->
        <div class="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg transition-all duration-300 hover:border-violet-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-violet-500/10 hover:scale-[1.02]">
          <div class="p-6">
            <!-- Icon -->
            <div 
              class="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              :class="getIconColor(category.slug)"
            >
              <component 
                :is="getIcon(category.slug)" 
                class="w-7 h-7"
              />
            </div>
            
            <!-- Title -->
            <h3 class="text-xl font-semibold text-white group-hover:text-violet-400 transition-colors mb-2">
              {{ category.name }}
            </h3>
            
            <!-- Description -->
            <p v-if="category.description" class="text-sm text-slate-400 line-clamp-2 mb-4">
              {{ category.description }}
            </p>
            
            <!-- Browse Link -->
            <div class="flex items-center text-sm text-slate-300 group-hover:text-violet-400 transition-colors">
              <span>Browse products</span>
              <ArrowRight class="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- View All Link -->
    <div class="text-center mt-10">
      <NuxtLink 
        to="/categories" 
        class="inline-flex items-center text-violet-400 hover:text-violet-300 font-medium transition-colors"
      >
        View all categories
        <ArrowRight class="w-4 h-4 ml-1" />
      </NuxtLink>
    </div>
  </section>
</template>
