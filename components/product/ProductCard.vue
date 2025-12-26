<script setup lang="ts">
import { ShoppingCart, Cpu, Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '~/types/database.types'
import { useCartStore } from '~/stores/cart'
import { toast } from 'vue-sonner'

// Use Row type from Database definition
type Product = Database['public']['Tables']['products']['Row'] & {
  categories?: { name: string; slug: string } | null
}

const props = defineProps<{
  product: Product
}>()

const cartStore = useCartStore()

// Image error handling
const imageError = ref(false)
const imageLoaded = ref(false)

const handleImageError = () => {
  imageError.value = true
  imageLoaded.value = true
}

const handleImageLoad = () => {
  imageLoaded.value = true
}

// Reset error state when product changes
watch(() => props.product.id, () => {
  imageError.value = false
  imageLoaded.value = false
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price)
}

const handleAddToCart = () => {
  cartStore.addToCart(props.product)
  toast.success(`${props.product.name} added to cart!`, {
    description: 'Click the cart icon to view your items.',
  })
}

// Calculate discount percentage
const discountPercentage = computed(() => {
  if (props.product.compare_at_price && props.product.compare_at_price > props.product.price) {
    return Math.round((1 - props.product.price / props.product.compare_at_price) * 100)
  }
  return 0
})
</script>

<template>
  <Card class="group relative overflow-hidden h-full flex flex-col bg-gradient-to-b from-card to-card/50 border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1">
    <!-- Product Image -->
    <div class="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
      <!-- Loading Skeleton -->
      <div 
        v-if="!imageLoaded" 
        class="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted/50"
      />
      
      <!-- Actual Image -->
      <img 
        v-if="!imageError"
        :src="product.images?.[0] || '/placeholder.png'" 
        :alt="product.name" 
        class="object-cover w-full h-full transition-all duration-700 group-hover:scale-105"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        @error="handleImageError"
        @load="handleImageLoad"
        loading="lazy"
      />
      
      <!-- Beautiful Hardware Placeholder (Apple-level clean) -->
      <div 
        v-if="imageError" 
        class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted/60"
      >
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute inset-0 blur-2xl bg-primary/20 rounded-full scale-150" />
          <!-- Icon container -->
          <div class="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
            <Cpu class="w-12 h-12 text-primary/60" />
          </div>
        </div>
        <p class="mt-4 text-sm text-muted-foreground/60 font-medium">Hardware Image</p>
      </div>
      
      <!-- Sale Badge -->
      <Badge 
        v-if="discountPercentage > 0" 
        class="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg shadow-red-500/25 font-semibold"
      >
        -{{ discountPercentage }}%
      </Badge>
      
      <!-- Stock Warning Badge -->
      <Badge 
        v-if="product.stock_quantity > 0 && product.stock_quantity < 5" 
        variant="outline"
        class="absolute top-3 right-3 bg-amber-500/10 text-amber-500 border-amber-500/30 backdrop-blur-sm"
      >
        Only {{ product.stock_quantity }} left
      </Badge>
      
      <!-- Quick Add Overlay -->
      <div class="absolute inset-x-0 bottom-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <Button 
          @click.prevent="handleAddToCart" 
          class="w-full bg-primary/90 backdrop-blur-sm hover:bg-primary shadow-lg"
          :disabled="product.stock_quantity === 0"
        >
          <ShoppingCart class="w-4 h-4 mr-2" />
          {{ product.stock_quantity > 0 ? 'Quick Add' : 'Out of Stock' }}
        </Button>
      </div>
    </div>
    
    <!-- Product Info -->
    <CardHeader class="p-4 pb-2 flex-none">
      <!-- Category -->
      <div v-if="product.categories" class="flex items-center gap-1.5 mb-1">
        <div class="w-1.5 h-1.5 rounded-full bg-primary/60" />
        <span class="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          {{ product.categories.name }}
        </span>
      </div>
      <!-- Product Name -->
      <CardTitle class="line-clamp-2 text-base leading-snug tracking-tight">
        <NuxtLink 
          :to="`/products/${product.slug}`"
          class="hover:text-primary transition-colors duration-200"
        >
          {{ product.name }}
        </NuxtLink>
      </CardTitle>
    </CardHeader>
    
    <!-- Description -->
    <CardContent class="p-4 pt-0 flex-1">
      <p v-if="product.description" class="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
        {{ product.description }}
      </p>
    </CardContent>
    
    <!-- Price & Actions -->
    <CardFooter class="p-4 pt-2 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-4">
      <div class="flex flex-col">
        <span class="text-xl font-bold tracking-tight text-foreground">
          {{ formatPrice(product.price) }}
        </span>
        <span 
          v-if="product.compare_at_price && discountPercentage > 0" 
          class="text-sm text-muted-foreground line-through"
        >
          {{ formatPrice(product.compare_at_price) }}
        </span>
      </div>
      
      <Button 
        @click="handleAddToCart" 
        size="sm" 
        :disabled="product.stock_quantity === 0"
        class="shadow-sm hover:shadow-md transition-shadow"
      >
        <ShoppingCart class="w-4 h-4" />
        <span class="sr-only">Add to cart</span>
      </Button>
    </CardFooter>
  </Card>
</template>
