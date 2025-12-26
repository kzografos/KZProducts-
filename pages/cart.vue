<script setup lang="ts">
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
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
  <div class="container py-8 max-w-4xl">
    <h1 class="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

    <div v-if="cartStore.items.length === 0" class="text-center py-20 border rounded-lg bg-muted/20">
      <ShoppingBag class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h2 class="text-2xl font-semibold mb-2">Your cart is empty</h2>
      <p class="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
      <Button as-child>
        <NuxtLink to="/products">Start Shopping</NuxtLink>
      </Button>
    </div>

    <div v-else class="grid md:grid-cols-3 gap-8">
      <!-- Cart Items -->
      <div class="md:col-span-2 space-y-4">
        <div v-for="item in cartStore.items" :key="item.productId" class="flex gap-4 p-4 border rounded-lg bg-card">
          <div class="h-24 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0 border">
             <img :src="item.product.images?.[0] || '/placeholder.png'" class="object-cover w-full h-full" />
          </div>
          <div class="flex-1 flex flex-col justify-between">
            <div>
               <h3 class="font-semibold line-clamp-1">
                  <NuxtLink :to="`/products/${item.product.slug}`" class="hover:underline">
                    {{ item.product.name }}
                  </NuxtLink>
               </h3>
               <p class="text-sm text-muted-foreground mt-1">{{ formatPrice(item.product.price) }}</p>
            </div>
            <div class="flex items-center justify-between mt-2">
               <div class="flex items-center gap-1">
                 <Button 
                   variant="outline" 
                   size="icon" 
                   class="h-8 w-8"
                   @click="decrementQuantity(item.productId, item.quantity)"
                 >
                   <Minus class="h-3 w-3" />
                 </Button>
                 <span class="w-10 text-center font-medium">{{ item.quantity }}</span>
                 <Button 
                   variant="outline" 
                   size="icon" 
                   class="h-8 w-8"
                   @click="incrementQuantity(item.productId, item.quantity)"
                 >
                   <Plus class="h-3 w-3" />
                 </Button>
               </div>
               <Button variant="ghost" size="icon" @click="cartStore.removeFromCart(item.productId)" class="text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                 <Trash2 class="h-4 w-4" />
               </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="md:col-span-1">
        <div class="border rounded-lg p-6 bg-muted/20 sticky top-24">
          <h3 class="font-semibold text-lg mb-4">Order Summary</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Subtotal</span>
              <span>{{ formatPrice(cartStore.total) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div class="border-t pt-2 mt-2 font-bold text-base flex justify-between">
              <span>Total</span>
              <span>{{ formatPrice(cartStore.total) }}</span>
            </div>
          </div>
          
          <Button class="w-full mt-6" size="lg" as-child>
            <NuxtLink to="/checkout">
              Checkout <ArrowRight class="ml-2 h-4 w-4" />
            </NuxtLink>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
