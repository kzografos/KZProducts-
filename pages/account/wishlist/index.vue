<script setup lang="ts">
import { Heart, ShoppingCart, Trash2, ShoppingBag } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

definePageMeta({
  middleware: 'auth'
})

// Types
interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  images: string[] | null
  stock_quantity: number
}

interface WishlistItemWithProduct {
  id: string
  product_id: string
  created_at: string
  products: Product
}

const client = useSupabaseClient()
const user = useSupabaseUser()
const { removeFromWishlist } = useWishlist()
const cartStore = useCartStore()

// State
const items = ref<WishlistItemWithProduct[]>([])
const loading = ref(true)

// Fetch wishlist with product details
const fetchWishlistWithProducts = async () => {
  if (!user.value?.id) return

  loading.value = true
  try {
    const { data, error } = await client
      .from('wishlist_items')
      .select(`
        id,
        product_id,
        created_at,
        products:product_id (
          id,
          name,
          slug,
          price,
          compare_at_price,
          images,
          stock_quantity
        )
      `)
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    items.value = (data || []) as unknown as WishlistItemWithProduct[]
  } catch (error) {
    console.error('Failed to fetch wishlist:', error)
    toast.error('Failed to load wishlist')
  } finally {
    loading.value = false
  }
}

// Remove item from wishlist
const handleRemove = async (item: WishlistItemWithProduct) => {
  const success = await removeFromWishlist(item.product_id)
  if (success) {
    items.value = items.value.filter(i => i.id !== item.id)
  }
}

// Add to cart
const handleAddToCart = (product: Product) => {
  cartStore.addToCart(product as any)
  toast.success(`${product.name} added to cart!`)
}

// Format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price)
}

// On mount
onMounted(fetchWishlistWithProducts)

// Watch user changes
watch(user, (newUser) => {
  if (newUser?.id) {
    fetchWishlistWithProducts()
  }
})
</script>

<template>
  <div class="container py-8 md:py-12 max-w-6xl">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">My Favorites</h1>
        <p class="text-muted-foreground">{{ items.length }} product{{ items.length !== 1 ? 's' : '' }} saved</p>
      </div>
      <Button as-child variant="outline" class="border-white/10">
        <NuxtLink to="/products">
          <ShoppingBag class="mr-2 h-4 w-4" />
          Continue Shopping
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      <div v-for="i in 8" :key="i" class="rounded-xl border border-white/10 bg-muted/20 animate-pulse">
        <div class="aspect-[4/5]" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="text-center py-16">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <Heart class="w-8 h-8 text-red-500/60" />
      </div>
      <h2 class="text-xl font-semibold mb-2">No favorites yet</h2>
      <p class="text-muted-foreground mb-6">Start adding products to your wishlist by clicking the heart icon</p>
      <Button as-child>
        <NuxtLink to="/products">Browse Products</NuxtLink>
      </Button>
    </div>

    <!-- Wishlist Grid - Compact Cards -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      <div 
        v-for="item in items" 
        :key="item.id"
        class="group relative overflow-hidden rounded-xl border border-white/10 bg-card/50 backdrop-blur transition-all hover:border-white/20 hover:shadow-lg"
      >
        <!-- Product Image -->
        <NuxtLink :to="`/products/${item.products.slug}`" class="block aspect-square overflow-hidden">
          <img
            :src="item.products.images?.[0] || '/placeholder.png'"
            :alt="item.products.name"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </NuxtLink>

        <!-- Remove Button -->
        <button
          @click="handleRemove(item)"
          class="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white/80 transition-all hover:bg-red-500 hover:text-white"
          aria-label="Remove from favorites"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>

        <!-- Product Info - Compact -->
        <div class="p-3">
          <NuxtLink :to="`/products/${item.products.slug}`">
            <h3 class="text-sm font-medium text-white line-clamp-1 hover:text-violet-400 transition-colors">
              {{ item.products.name }}
            </h3>
          </NuxtLink>

          <div class="mt-1 flex items-baseline gap-1.5">
            <span class="text-sm font-bold text-white">
              {{ formatPrice(item.products.price) }}
            </span>
            <span 
              v-if="item.products.compare_at_price && item.products.compare_at_price > item.products.price"
              class="text-xs text-slate-500 line-through"
            >
              {{ formatPrice(item.products.compare_at_price) }}
            </span>
          </div>

          <!-- Add to Cart Button - Compact -->
          <button
            @click="handleAddToCart(item.products)"
            :disabled="item.products.stock_quantity === 0"
            class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-600 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart class="h-3.5 w-3.5" />
            {{ item.products.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
