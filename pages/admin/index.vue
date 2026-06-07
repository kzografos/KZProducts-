<script setup lang="ts">
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle, ArrowRight } from 'lucide-vue-next'
import type { Database } from '~/types/database.types'

type Order = Database['public']['Tables']['orders']['Row']

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient<Database>()

// Stats
const stats = ref({
  totalProducts: 0,
  totalOrders: 0,
  totalCustomers: 0,
  revenue: 0,
  lowStockCount: 0
})

const recentOrders = ref<Order[]>([])
const loading = ref(true)

// Fetch dashboard stats
const fetchStats = async () => {
  loading.value = true
  try {
    // Get total products
    const { count: productsCount } = await client
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    // Get total orders
    const { count: ordersCount } = await client
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    // Get total customers (profiles)
    const { count: customersCount } = await client
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // Get revenue (sum of all orders except cancelled)
    const { data: orders } = await client
      .from('orders')
      .select('total, status')
      .neq('status', 'cancelled')
    
    const revenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    
    // Get low stock products
    const { count: lowStock } = await client
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('stock_quantity', 5)
    
    // Get recent orders
    const { data: recent } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    recentOrders.value = recent || []
    
    stats.value = {
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      totalCustomers: customersCount || 0,
      revenue,
      lowStockCount: lowStock || 0
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  } finally {
    loading.value = false
  }
}

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

// Format date
const formatDate = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('el-GR', {
    month: 'short',
    day: 'numeric'
  })
}

// Status colors
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid': return 'text-emerald-400'
    case 'shipped': return 'text-blue-400'
    case 'delivered': return 'text-violet-400'
    case 'cancelled': return 'text-rose-400'
    default: return 'text-amber-400'
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Dashboard</h1>
      <p class="mt-1 text-slate-400">Welcome to your admin dashboard</p>
    </div>

    <!-- Stats grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminStatWidget
        title="Total Revenue"
        :value="formatCurrency(stats.revenue)"
        :change="15"
        change-label="from last month"
        :icon="DollarSign"
        icon-color="bg-violet-500/20 text-violet-400"
        :loading="loading"
      />
      
      <AdminStatWidget
        title="Total Orders"
        :value="stats.totalOrders"
        :change="8"
        change-label="from last month"
        :icon="ShoppingCart"
        icon-color="bg-emerald-500/20 text-emerald-400"
        :loading="loading"
      />
      
      <AdminStatWidget
        title="Total Customers"
        :value="stats.totalCustomers"
        :change="5"
        change-label="from last month"
        :icon="Users"
        icon-color="bg-amber-500/20 text-amber-400"
        :loading="loading"
      />
      
      <AdminStatWidget
        title="Total Products"
        :value="stats.totalProducts"
        :change="12"
        change-label="from last month"
        :icon="Package"
        icon-color="bg-blue-500/20 text-blue-400"
        :loading="loading"
      />
    </div>

    <!-- Revenue Chart -->
    <div class="mt-6">
      <AdminRevenueChart />
    </div>

    <!-- Alerts section -->
    <div v-if="stats.lowStockCount > 0" class="mt-6">
      <div class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <AlertTriangle class="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p class="font-medium text-amber-400">Low Stock Alert</p>
            <p class="text-sm text-slate-400">
              {{ stats.lowStockCount }} product(s) have less than 5 items in stock
            </p>
          </div>
          <NuxtLink
            to="/admin/products"
            class="ml-auto rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
          >
            View Products
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Recent orders section -->
    <div class="mt-8">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">Recent Orders</h2>
        <NuxtLink
          to="/admin/orders"
          class="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
        >
          View all
          <ArrowRight class="h-4 w-4" />
        </NuxtLink>
      </div>
      
      <div v-if="loading" class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
      
      <div v-else-if="recentOrders.length === 0" class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <ShoppingCart class="mx-auto h-12 w-12 text-slate-600" />
        <p class="mt-4 text-slate-400">No orders yet</p>
      </div>
      
      <div v-else class="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table class="min-w-[560px] w-full">
          <thead>
            <tr class="border-b border-white/10 text-left text-sm text-slate-400">
              <th class="px-4 py-3 font-medium">Order</th>
              <th class="px-4 py-3 font-medium">Date</th>
              <th class="px-4 py-3 font-medium">Total</th>
              <th class="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-white/5">
              <td class="px-4 py-3 font-medium text-white">
                #{{ order.order_number || order.id.slice(0, 8).toUpperCase() }}
              </td>
              <td class="px-4 py-3 text-slate-400">
                {{ formatDate(order.created_at) }}
              </td>
              <td class="px-4 py-3 text-white">
                {{ formatCurrency(order.total || 0) }}
              </td>
              <td class="px-4 py-3">
                <span :class="['font-medium capitalize', getStatusColor(order.status || 'pending')]">
                  {{ order.status || 'Pending' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
