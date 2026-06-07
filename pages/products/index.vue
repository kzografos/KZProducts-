<script setup lang="ts">
import { Loader2, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ProductCard from '@/components/product/ProductCard.vue'

type ProductSortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'popularity' | 'reviews'

interface ProductMetrics {
  averageRating: number
  reviewCount: number
  soldQuantity: number
}

const route = useRoute()
const router = useRouter()
const { products, loading, error, fetchProducts } = useProducts()
const productMetrics = ref<Record<string, ProductMetrics>>({})

const sortOptions: { value: ProductSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'reviews', label: 'Reviews' }
]

const getRouteSearchQuery = () => {
  const query = route.query.q

  if (Array.isArray(query)) {
    return query.find(value => typeof value === 'string') || ''
  }

  return typeof query === 'string' ? query : ''
}

const searchQuery = ref(getRouteSearchQuery())
const isSortOption = (value: unknown): value is ProductSortOption => {
  return typeof value === 'string' && sortOptions.some(option => option.value === value)
}

const getRouteSortOption = (): ProductSortOption => {
  const query = route.query.sort

  if (Array.isArray(query)) {
    return isSortOption(query[0]) ? query[0] : 'newest'
  }

  return isSortOption(query) ? query : 'newest'
}

const sortOption = ref<ProductSortOption>(getRouteSortOption())

const updateRouteQuery = (updates: { q?: string; sort?: ProductSortOption }) => {
  const query = { ...route.query }
  const nextSearchQuery = updates.q !== undefined ? updates.q : getRouteSearchQuery()
  const nextSortOption = updates.sort !== undefined ? updates.sort : getRouteSortOption()

  if (nextSearchQuery) {
    query.q = nextSearchQuery
  } else {
    delete query.q
  }

  if (nextSortOption !== 'newest') {
    query.sort = nextSortOption
  } else {
    delete query.sort
  }

  void router.replace({ path: route.path, query })
}

const fetchProductMetrics = async () => {
  try {
    const data = await $fetch<{ metrics: Record<string, ProductMetrics> }>('/api/products/metrics')
    productMetrics.value = data.metrics
  } catch (e) {
    console.error('Failed to load product metrics:', e)
    productMetrics.value = {}
  }
}

// Fetch products on mount
onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchProductMetrics()
  ])
})

watch(
  () => route.query.q,
  () => {
    const nextQuery = getRouteSearchQuery()

    if (searchQuery.value !== nextQuery) {
      searchQuery.value = nextQuery
    }
  }
)

watch(
  () => route.query.sort,
  () => {
    const nextSortOption = getRouteSortOption()

    if (sortOption.value !== nextSortOption) {
      sortOption.value = nextSortOption
    }
  }
)

watch(searchQuery, (value) => {
  const nextQuery = value.trim()

  if (nextQuery === getRouteSearchQuery()) {
    return
  }

  updateRouteQuery({ q: nextQuery })
})

watch(sortOption, (value) => {
  if (value === getRouteSortOption()) {
    return
  }

  updateRouteQuery({ sort: value })
})

// Filter products by search query
const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return products.value

  return products.value.filter(
    p => p.name.toLowerCase().includes(query) || 
         p.description?.toLowerCase().includes(query)
  )
})

const getProductMetrics = (productId: string) => {
  return productMetrics.value[productId] || {
    averageRating: 0,
    reviewCount: 0,
    soldQuantity: 0
  }
}

const sortedProducts = computed(() => {
  const sorted = [...filteredProducts.value]

  switch (sortOption.value) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name))
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'popularity':
      return sorted.sort((a, b) => {
        const aMetrics = getProductMetrics(a.id)
        const bMetrics = getProductMetrics(b.id)

        return bMetrics.soldQuantity - aMetrics.soldQuantity ||
          bMetrics.reviewCount - aMetrics.reviewCount ||
          a.name.localeCompare(b.name)
      })
    case 'reviews':
      return sorted.sort((a, b) => {
        const aMetrics = getProductMetrics(a.id)
        const bMetrics = getProductMetrics(b.id)

        return bMetrics.averageRating - aMetrics.averageRating ||
          bMetrics.reviewCount - aMetrics.reviewCount ||
          a.name.localeCompare(b.name)
      })
    case 'newest':
    default:
      return sorted.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0

        return bTime - aTime || a.name.localeCompare(b.name)
      })
  }
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
      
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <!-- Search -->
        <div class="relative sm:w-[220px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            v-model="searchQuery"
            placeholder="Filter products..."
            class="pl-9 w-full"
          />
        </div>

        <Select v-model="sortOption">
          <SelectTrigger class="w-full bg-white/5 border-white/10 sm:w-[190px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in sortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
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
      class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <ProductCard 
        v-for="product in sortedProducts"
        :key="product.id" 
        :product="product"
      />
    </div>

    <!-- Results Count -->
    <div v-if="!loading && filteredProducts.length > 0" class="mt-8 text-center text-sm text-muted-foreground">
      Showing {{ sortedProducts.length }} of {{ products.length }} products
    </div>
  </div>
</template>
