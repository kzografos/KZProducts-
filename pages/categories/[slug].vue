<script setup lang="ts">
import { Loader2, ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const { fetchProducts, products, loading, error } = useProducts()

const slug = route.params.slug as string
const categoryName = computed(() => {
    // Ideally fetch category details to get pretty name
    return slug.charAt(0).toUpperCase() + slug.slice(1)
})

onMounted(() => {
  fetchProducts(slug)
})
</script>

<template>
  <div class="container py-6 sm:py-8">
    <Button variant="ghost" class="mb-6 hover:bg-transparent hover:text-primary" as-child>
      <NuxtLink to="/products">
        <ArrowLeft class="mr-2 h-4 w-4" />
        All Products
      </NuxtLink>
    </Button>

    <div class="flex flex-col space-y-4 mb-8">
      <h1 class="text-3xl font-bold tracking-tight">{{ categoryName }}</h1>
      <p class="text-muted-foreground">Products in {{ categoryName }} category.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-destructive/10 text-destructive p-4 rounded-md">
      Error loading products: {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="text-center py-20 text-muted-foreground">
      No products found in this category.
    </div>

    <!-- Product Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <ProductCard 
        v-for="product in products" 
        :key="product.id" 
        :product="product" 
      />
    </div>
  </div>
</template>
