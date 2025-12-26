<script setup lang="ts">
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()

// Initialize cart from localStorage on mount
onMounted(() => {
  cartStore.initFromStorage()
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price)
}

const incrementQuantity = (productId: string, currentQty: number) => {
  cartStore.updateQuantity(productId, currentQty + 1)
}

const decrementQuantity = (productId: string, currentQty: number) => {
  cartStore.updateQuantity(productId, currentQty - 1)
}
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button 
        variant="ghost" 
        size="icon" 
        class="hover:bg-white/10 relative"
      >
        <div class="relative">
          <ShoppingCart class="h-5 w-5" />
          <Badge 
            v-if="cartStore.count > 0" 
            variant="destructive" 
            class="absolute -right-2 -top-2 px-1.5 py-0.5 text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center"
          >
            {{ cartStore.count > 99 ? '99+' : cartStore.count }}
          </Badge>
          <span class="sr-only">Shopping Cart</span>
        </div>
      </Button>
    </SheetTrigger>
    
    <SheetContent side="right" class="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-l border-white/10 flex flex-col">
      <SheetHeader class="space-y-2.5 pr-6">
        <SheetTitle class="flex items-center gap-2">
          <ShoppingCart class="h-5 w-5 text-primary" />
          Shopping Cart
          <Badge v-if="cartStore.count > 0" variant="secondary" class="ml-2">
            {{ cartStore.count }} {{ cartStore.count === 1 ? 'item' : 'items' }}
          </Badge>
        </SheetTitle>
      </SheetHeader>
      
      <Separator class="my-4 bg-white/10" />
      
      <!-- Empty State -->
      <div v-if="cartStore.items.length === 0" class="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div class="p-4 rounded-full bg-muted/50 mb-4">
          <ShoppingBag class="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 class="font-semibold text-lg mb-1">Your cart is empty</h3>
        <p class="text-muted-foreground text-sm mb-6">Add some products to get started!</p>
        <Button as-child>
          <NuxtLink to="/products">Browse Products</NuxtLink>
        </Button>
      </div>
      
      <!-- Cart Items -->
      <div v-else class="flex-1 overflow-y-auto -mx-6 px-6">
        <div class="space-y-4">
          <div 
            v-for="item in cartStore.items" 
            :key="item.productId" 
            class="flex gap-4 p-3 rounded-lg bg-muted/20 border border-white/5 hover:border-white/10 transition-colors"
          >
            <!-- Product Image -->
            <div class="h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-white/10">
              <img 
                :src="item.product.images?.[0] || '/placeholder.png'" 
                :alt="item.product.name"
                class="object-cover w-full h-full" 
              />
            </div>
            
            <!-- Product Details -->
            <div class="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <NuxtLink 
                  :to="`/products/${item.product.slug}`" 
                  class="font-medium line-clamp-1 hover:text-primary transition-colors text-sm"
                >
                  {{ item.product.name }}
                </NuxtLink>
                <p class="text-primary font-semibold mt-0.5">
                  {{ formatPrice(item.product.price) }}
                </p>
              </div>
              
              <!-- Quantity Controls -->
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    class="h-7 w-7 border-white/10 hover:bg-white/10"
                    @click="decrementQuantity(item.productId, item.quantity)"
                  >
                    <Minus class="h-3 w-3" />
                  </Button>
                  <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    class="h-7 w-7 border-white/10 hover:bg-white/10"
                    @click="incrementQuantity(item.productId, item.quantity)"
                  >
                    <Plus class="h-3 w-3" />
                  </Button>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  @click="cartStore.removeFromCart(item.productId)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer with Total & Actions -->
      <div v-if="cartStore.items.length > 0" class="border-t border-white/10 pt-4 mt-4 space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-muted-foreground">Subtotal</span>
          <span class="text-xl font-bold">{{ formatPrice(cartStore.total) }}</span>
        </div>
        
        <div class="grid grid-cols-2 gap-3">
          <Button variant="outline" as-child class="border-white/10 hover:bg-white/10">
            <NuxtLink to="/cart">View Cart</NuxtLink>
          </Button>
          <Button as-child class="shadow-lg shadow-primary/25">
            <NuxtLink to="/checkout">
              Checkout <ArrowRight class="ml-2 h-4 w-4" />
            </NuxtLink>
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
