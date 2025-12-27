<script setup lang="ts">
import { Loader2, ShoppingBag, Shield, Truck, CreditCard, ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '~/stores/cart'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'checkout',
  middleware: 'auth'
})

const cartStore = useCartStore()
const router = useRouter()
const user = useSupabaseUser()

// Initialize cart from localStorage
onMounted(() => {
  cartStore.initFromStorage()
})

const loading = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  fullName: '',
  email: user.value?.email || '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Greece'
})

const handleCheckout = async () => {
  if (cartStore.items.length === 0) {
    error.value = 'Your cart is empty'
    return
  }

  loading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await useFetch('/api/orders/create', {
      method: 'POST',
      body: {
        items: cartStore.items,
        shipping: form
      }
    })

    if (fetchError.value) {
      throw new Error(fetchError.value.statusMessage || 'Failed to create order')
    }

    if (data.value?.success) {
      // Clear local cart
      cartStore.clearCart()
      
      // Redirect to success page with order number
      router.push(`/checkout/success?order=${data.value.order.orderNumber}`)
    }
  } catch (e: any) {
    error.value = e.message || 'An error occurred during checkout'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price)
}
</script>

<template>
  <div class="min-h-screen py-8 md:py-12">
    <div class="container max-w-6xl">
      <!-- Back to Cart -->
      <NuxtLink 
        to="/cart" 
        class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Cart
      </NuxtLink>

      <div class="grid lg:grid-cols-5 gap-8 lg:gap-12">
        <!-- Left: Shipping Form (3 cols) -->
        <div class="lg:col-span-3 space-y-8">
          <!-- Trust Badges -->
          <div class="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div class="flex items-center gap-2">
              <Shield class="w-4 h-4 text-green-500" />
              <span>Secure Checkout</span>
            </div>
            <div class="flex items-center gap-2">
              <Truck class="w-4 h-4 text-blue-500" />
              <span>Free Shipping</span>
            </div>
            <div class="flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-purple-500" />
              <span>Safe Payment</span>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="space-y-4">
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
              Contact Information
            </h2>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  v-model="form.email" 
                  placeholder="you@example.com"
                  class="bg-background/50 border-white/10 focus:border-primary"
                  required 
                />
              </div>
              <div class="grid gap-2">
                <Label for="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  v-model="form.phone" 
                  placeholder="+30 123 456 7890"
                  class="bg-background/50 border-white/10 focus:border-primary"
                  required 
                />
              </div>
            </div>
          </div>

          <Separator class="bg-white/10" />

          <!-- Shipping Address -->
          <div class="space-y-4">
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
              Shipping Address
            </h2>
            <form @submit.prevent="handleCheckout" id="checkout-form" class="space-y-4">
              <div class="grid gap-2">
                <Label for="name">Full Name</Label>
                <Input 
                  id="name" 
                  v-model="form.fullName" 
                  placeholder="John Doe"
                  class="bg-background/50 border-white/10 focus:border-primary"
                  required 
                />
              </div>
              <div class="grid gap-2">
                <Label for="address">Street Address</Label>
                <Input 
                  id="address" 
                  v-model="form.address" 
                  placeholder="123 Main Street, Apt 4"
                  class="bg-background/50 border-white/10 focus:border-primary"
                  required 
                />
              </div>
              <div class="grid md:grid-cols-3 gap-4">
                <div class="grid gap-2 md:col-span-1">
                  <Label for="city">City</Label>
                  <Input 
                    id="city" 
                    v-model="form.city" 
                    placeholder="Athens"
                    class="bg-background/50 border-white/10 focus:border-primary"
                    required 
                  />
                </div>
                <div class="grid gap-2">
                  <Label for="postal">Postal Code</Label>
                  <Input 
                    id="postal" 
                    v-model="form.postalCode" 
                    placeholder="10557"
                    class="bg-background/50 border-white/10 focus:border-primary"
                    required 
                  />
                </div>
                <div class="grid gap-2">
                  <Label for="country">Country</Label>
                  <Input 
                    id="country" 
                    v-model="form.country" 
                    class="bg-background/50 border-white/10"
                    disabled 
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Right: Order Summary (2 cols) -->
        <div class="lg:col-span-2">
          <div class="sticky top-8">
            <div class="relative">
              <!-- Glassmorphism effect -->
              <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-xl" />
              <div class="relative bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag class="w-5 h-5 text-primary" />
                  Order Summary
                </h2>
                
                <!-- Empty Cart -->
                <div v-if="cartStore.items.length === 0" class="text-center py-8 text-muted-foreground">
                  <ShoppingBag class="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Your cart is empty</p>
                </div>

                <!-- Cart Items -->
                <div v-else class="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                  <div 
                    v-for="item in cartStore.items" 
                    :key="item.productId" 
                    class="flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div class="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-white/10">
                      <img 
                        :src="item.product.images?.[0] || '/placeholder.png'" 
                        :alt="item.product.name"
                        class="object-cover w-full h-full" 
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm line-clamp-1">{{ item.product.name }}</p>
                      <p class="text-xs text-muted-foreground">Qty: {{ item.quantity }}</p>
                      <p class="text-sm font-semibold text-primary">{{ formatPrice(item.product.price * item.quantity) }}</p>
                    </div>
                  </div>
                </div>

                <Separator class="bg-white/10 my-4" />
                
                <!-- Totals -->
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Subtotal</span>
                    <span>{{ formatPrice(cartStore.total) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Shipping</span>
                    <span class="text-green-500">Free</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted-foreground">Tax</span>
                    <span>€0.00</span>
                  </div>
                </div>

                <Separator class="bg-white/10 my-4" />

                <div class="flex justify-between font-bold text-lg mb-6">
                  <span>Total</span>
                  <span class="text-primary">{{ formatPrice(cartStore.total) }}</span>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {{ error }}
                </div>

                <!-- Submit Button -->
                <button 
                  type="submit" 
                  form="checkout-form"
                  :disabled="loading || cartStore.items.length === 0"
                  class="w-full inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                >
                  <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                  <template v-else>
                    <CreditCard class="mr-2 h-4 w-4" />
                  </template>
                  {{ loading ? 'Processing...' : 'Complete Order' }}
                </button>

                <p class="text-xs text-center text-muted-foreground mt-4">
                  By placing this order, you agree to our Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
