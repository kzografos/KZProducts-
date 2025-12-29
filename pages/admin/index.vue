<script setup lang="ts">
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle } from 'lucide-vue-next'
import type { Database } from '~/types/database.types'

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
    
    // Get revenue (sum of completed orders)
    const { data: orders } = await client
      .from('orders')
      .select('total')
      .eq('status', 'completed')
    
    const revenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    
    // Get low stock products
    const { count: lowStock } = await client
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('stock_quantity', 5)
    
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
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
        title="Total Products"
        :value="stats.totalProducts"
        :change="12"
        change-label="from last month"
        :icon="Package"
        icon-color="bg-blue-500/20 text-blue-400"
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
        title="Customers"
        :value="stats.totalCustomers"
        :change="5"
        change-label="from last month"
        :icon="Users"
        icon-color="bg-amber-500/20 text-amber-400"
        :loading="loading"
      />
      
      <AdminStatWidget
        title="Revenue"
        :value="formatCurrency(stats.revenue)"
        :change="15"
        change-label="from last month"
        :icon="DollarSign"
        icon-color="bg-violet-500/20 text-violet-400"
        :loading="loading"
      />
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
            to="/admin/products?filter=low-stock"
            class="ml-auto rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
          >
            View Products
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Recent orders section placeholder -->
    <div class="mt-8">
      <h2 class="mb-4 text-lg font-semibold text-white">Recent Orders</h2>
      <div class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <ShoppingCart class="mx-auto h-12 w-12 text-slate-600" />
        <p class="mt-4 text-slate-400">Order management coming soon</p>
      </div>
    </div>
  </div>
</template>
