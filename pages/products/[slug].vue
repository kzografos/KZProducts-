<script setup lang="ts">
import { ShoppingCart, Loader2, ArrowLeft, ImageOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useCartStore } from '~/stores/cart'
import { toast } from 'vue-sonner'

const route = useRoute()
const { fetchProduct, loading, error } = useProducts()
const cartStore = useCartStore()

const slug = route.params.slug as string
const product = ref<any>(null)
const imageError = ref(false)

onMounted(async () => {
  product.value = await fetchProduct(slug)
})

const handleAddToCart = () => {
  if (product.value) {
    cartStore.addToCart(product.value)
    toast.success(`${product.value.name} added to cart!`, {
      description: 'Click the cart icon to view your items.',
    })
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price)
}

const handleImageError = () => {
  imageError.value = true
}

const imageSrc = computed(() => {
  if (imageError.value) return '/placeholder.png'
  return product.value?.images?.[0] || '/placeholder.png'
})
</script>

<template>
  <div class="container py-8">
    <Button variant="ghost" class="mb-6 pl-0 hover:bg-transparent hover:text-primary" as-child>
      <NuxtLink to="/products">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Back to Products
      </NuxtLink>
    </Button>

    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
    </div>

    <div v-else-if="error || !product" class="text-center py-20">
      <h2 class="text-2xl font-bold mb-2">Product not found</h2>
      <p class="text-muted-foreground">{{ error || "The product you're looking for doesn't exist." }}</p>
      <Button as-child class="mt-4">
        <NuxtLink to="/products">Browse All Products</NuxtLink>
      </Button>
    </div>

    <div v-else class="grid md:grid-cols-2 gap-8 lg:gap-12">
      <!-- Image Gallery -->
      <div class="space-y-4">
        <div class="aspect-square bg-muted rounded-lg overflow-hidden border relative">
          <img 
            :src="imageSrc" 
            :alt="product.name" 
            class="object-cover w-full h-full"
            @error="handleImageError"
          />
          <!-- Image Error Overlay -->
          <div 
            v-if="imageError" 
            class="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-muted-foreground"
          >
            <ImageOff class="w-12 h-12 mb-2 opacity-50" />
            <span class="text-sm">Image unavailable</span>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-4" v-if="product.images?.length > 1">
          <div 
            v-for="(img, i) in product.images" 
            :key="i" 
            class="aspect-square bg-muted rounded-md overflow-hidden cursor-pointer border hover:border-primary transition-colors"
          >
            <img :src="img" class="object-cover w-full h-full" />
          </div>
        </div>
      </div>

      <!-- Details -->
      <div class="space-y-6">
        <div>
          <div v-if="product.categories" class="text-sm text-primary font-medium mb-1">
            {{ product.categories.name }}
          </div>
          <h1 class="text-3xl font-bold tracking-tight">{{ product.name }}</h1>
        </div>

        <div class="flex items-baseline gap-3">
          <span class="text-3xl font-bold text-primary">{{ formatPrice(product.price) }}</span>
          <span 
            v-if="product.compare_at_price && product.compare_at_price > product.price" 
            class="text-lg text-muted-foreground line-through"
          >
            {{ formatPrice(product.compare_at_price) }}
          </span>
        </div>

        <div class="prose dark:prose-invert max-w-none text-muted-foreground">
          <p>{{ product.description }}</p>
        </div>

        <div class="pt-6 border-t space-y-4">
          <Button 
            size="lg" 
            class="w-full md:w-auto shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" 
            @click="handleAddToCart" 
            :disabled="product.stock_quantity === 0"
          >
            <ShoppingCart class="mr-2 h-5 w-5" />
            {{ product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock' }}
          </Button>
          <p v-if="product.stock_quantity > 0 && product.stock_quantity < 5" class="text-sm text-amber-500">
            Only {{ product.stock_quantity }} left in stock!
          </p>
        </div>

        <!-- Metadata Specs -->
        <div v-if="product.metadata && Object.keys(product.metadata).length" class="pt-6 border-t">
          <h3 class="font-semibold mb-4">Specifications</h3>
          <dl class="space-y-2 text-sm">
            <div 
              v-for="(val, key) in product.metadata" 
              :key="key" 
              class="grid grid-cols-3 border-b pb-2"
            >
              <dt class="font-medium capitalize text-muted-foreground">{{ String(key).replace(/_/g, ' ') }}</dt>
              <dd class="col-span-2">{{ val }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>
