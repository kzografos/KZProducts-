<script setup lang="ts">
import { Loader2, Filter, Search, Grid3X3, List } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProductCard from '@/components/product/ProductCard.vue'

const route = useRoute()
const { products, loading, error, fetchProducts } = useProducts()

const searchQuery = ref((route.query.q as string) || '')
const viewMode = ref<'grid' | 'list'>('grid')

// Fetch products on mount
onMounted(async () => {
  await fetchProducts()
})

// Filter products by search query
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(
    p => p.name.toLowerCase().includes(query) || 
         p.description?.toLowerCase().includes(query)
  )
})
</script>

<template>
  <div class="container py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-white">All Products</h1>
        <p class="text-slate-400 mt-1">
          Browse our complete collection of PC components
        </p>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            v-model="searchQuery"
            placeholder="Search products..." 
            class="pl-9 w-[200px]"
          />
        </div>
        
        <!-- View Toggle -->
        <div class="hidden sm:flex border rounded-lg">
          <Button 
            variant="ghost" 
            size="icon"
            :class="viewMode === 'grid' ? 'bg-muted' : ''"
            @click="viewMode = 'grid'"
          >
            <Grid3X3 class="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            :class="viewMode === 'list' ? 'bg-muted' : ''"
            @click="viewMode = 'list'"
          >
            <List class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-20">
      <h2 class="text-2xl font-bold mb-2 text-destructive">Error loading products</h2>
      <p class="text-muted-foreground">{{ error }}</p>
      <Button @click="fetchProducts()" class="mt-4">Try Again</Button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredProducts.length === 0" class="text-center py-20">
      <h2 class="text-2xl font-bold mb-2">No products found</h2>
      <p class="text-muted-foreground">
        {{ searchQuery ? 'Try adjusting your search terms' : 'Check back soon for new products!' }}
      </p>
    </div>

    <!-- Products Grid -->
    <div 
      v-else 
      class="grid gap-6"
      :class="viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1'"
    >
      <ProductCard 
        v-for="product in filteredProducts" 
        :key="product.id" 
        :product="product"
      />
    </div>

    <!-- Results Count -->
    <div v-if="!loading && filteredProducts.length > 0" class="mt-8 text-center text-sm text-muted-foreground">
      Showing {{ filteredProducts.length }} of {{ products.length }} products
    </div>
  </div>
</template>
