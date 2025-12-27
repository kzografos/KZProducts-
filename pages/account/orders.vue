<script setup lang="ts">
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronRight, ShoppingBag } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '~/types/database.types'

definePageMeta({
  middleware: 'auth'
})

type Order = Database['public']['Tables']['orders']['Row']

const client = useSupabaseClient<Database>()
const loading = ref(true)
const orders = ref<Order[]>([])

// Fetch user's orders
const fetchOrders = async () => {
  loading.value = true
  const { data, error } = await client
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (!error && data) {
    orders.value = data
  }
  loading.value = false
}

onMounted(() => {
  fetchOrders()
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(price)
}

const formatDate = (date: string | null) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', { 
    day: 'numeric',
    month: 'short', 
    year: 'numeric'
  }).format(new Date(date))
}

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'completed':
      return { 
        icon: CheckCircle, 
        color: 'bg-green-500/20 text-green-500 border-green-500/30',
        label: 'Paid'
      }
    case 'shipped':
      return { 
        icon: Truck, 
        color: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
        label: 'Shipped'
      }
    case 'cancelled':
      return { 
        icon: XCircle, 
        color: 'bg-red-500/20 text-red-500 border-red-500/30',
        label: 'Cancelled'
      }
    case 'pending':
    default:
      return { 
        icon: Clock, 
        color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
        label: 'Pending'
      }
  }
}
</script>

<template>
  <div class="container py-8 md:py-12 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold mb-2">Order History</h1>
        <p class="text-muted-foreground">Track and manage your orders</p>
      </div>
      <Button as-child variant="outline" class="border-white/10">
        <NuxtLink to="/products">
          <ShoppingBag class="mr-2 h-4 w-4" />
          Continue Shopping
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-24 rounded-xl bg-muted/20 animate-pulse" />
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="text-center py-16">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
        <Package class="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 class="text-xl font-semibold mb-2">No orders yet</h2>
      <p class="text-muted-foreground mb-6">Start shopping to see your orders here</p>
      <Button as-child>
        <NuxtLink to="/products">Browse Products</NuxtLink>
      </Button>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <div 
        v-for="order in orders" 
        :key="order.id"
        class="group relative bg-card/50 backdrop-blur border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all hover:shadow-lg"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <!-- Order Info -->
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Package class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="font-semibold text-sm mb-1">{{ order.order_number }}</p>
              <p class="text-xs text-muted-foreground">{{ formatDate(order.created_at) }}</p>
            </div>
          </div>

          <!-- Status & Total -->
          <div class="flex items-center gap-4">
            <Badge 
              :class="['text-xs px-3 py-1 border', getStatusConfig(order.status).color]"
            >
              <component :is="getStatusConfig(order.status).icon" class="w-3 h-3 mr-1" />
              {{ getStatusConfig(order.status).label }}
            </Badge>
            <div class="text-right">
              <p class="font-bold">{{ formatPrice(order.total) }}</p>
            </div>
            <ChevronRight class="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
