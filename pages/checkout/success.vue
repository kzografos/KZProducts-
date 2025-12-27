<script setup lang="ts">
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

definePageMeta({
  layout: 'checkout'
})

const route = useRoute()
const orderNumber = computed(() => route.query.order as string || 'Unknown')

// Confetti effect on mount
onMounted(() => {
  // Simple celebration animation could be added here
})
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center py-12">
    <div class="container max-w-lg">
      <div class="relative">
        <!-- Glassmorphism effect -->
        <div class="absolute inset-0 bg-gradient-to-br from-green-500/20 to-primary/10 rounded-3xl blur-xl" />
        
        <div class="relative bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
          <!-- Success Icon -->
          <div class="relative mb-6">
            <div class="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle class="w-10 h-10 text-green-500" />
            </div>
            <!-- Animated ring -->
            <div class="absolute inset-0 w-20 h-20 mx-auto rounded-full border-2 border-green-500/30 animate-ping" />
          </div>

          <!-- Title -->
          <h1 class="text-3xl md:text-4xl font-bold mb-3">
            Order Confirmed!
          </h1>
          <p class="text-muted-foreground mb-6">
            Thank you for your purchase. Your order has been placed successfully.
          </p>

          <!-- Order Number -->
          <div class="bg-muted/30 rounded-xl p-4 mb-8 border border-white/5">
            <p class="text-sm text-muted-foreground mb-1">Order Number</p>
            <p class="text-xl font-mono font-bold text-primary">{{ orderNumber }}</p>
          </div>

          <!-- Info -->
          <div class="space-y-3 text-sm text-muted-foreground mb-8">
            <div class="flex items-center justify-center gap-2">
              <Package class="w-4 h-4" />
              <span>You will receive an email confirmation shortly</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3">
            <Button as-child variant="outline" class="flex-1 border-white/10 hover:bg-white/10">
              <NuxtLink to="/account/orders">
                <Package class="mr-2 h-4 w-4" />
                View Orders
              </NuxtLink>
            </Button>
            <Button as-child class="flex-1 shadow-lg shadow-primary/25">
              <NuxtLink to="/products">
                <ShoppingBag class="mr-2 h-4 w-4" />
                Continue Shopping
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
