<script setup lang="ts">
import { Eye, Search, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Database } from '~/types/database.types'

type Order = Database['public']['Tables']['orders']['Row']

interface OrderWithDetails extends Order {
  items?: any[]
  shippingAddress?: any
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient<Database>()

// State
const orders = ref<OrderWithDetails[]>([])
const loading = ref(true)
const searchQuery = ref('')
const modalOpen = ref(false)
const selectedOrder = ref<OrderWithDetails | null>(null)
const currentPage = ref(1)
const pageSize = 10

// Status options for toggle
const statusOrder = ['pending', 'paid', 'shipped', 'delivered']

// Fetch orders with details
const fetchOrders = async () => {
  loading.value = true
  try {
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    orders.value = (data || []).map(order => ({
      ...order,
      items: order.order_items
    }))
  } catch (error: any) {
    toast.error('Failed to load orders')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// Filtered orders
const filteredOrders = computed(() => {
  if (!searchQuery.value) return orders.value
  const query = searchQuery.value.toLowerCase()
  return orders.value.filter(order => 
    order.order_number?.toLowerCase().includes(query) ||
    order.id.toLowerCase().includes(query) ||
    order.status?.toLowerCase().includes(query)
  )
})

// Paginated orders
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredOrders.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / pageSize))

// View order details
const handleViewDetails = (order: OrderWithDetails) => {
  selectedOrder.value = order
  modalOpen.value = true
}

// Toggle status
const handleStatusToggle = async (order: OrderWithDetails) => {
  const currentIndex = statusOrder.indexOf(order.status || 'pending')
  const nextIndex = (currentIndex + 1) % statusOrder.length
  const nextStatus = statusOrder[nextIndex]

  try {
    const { error } = await client
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', order.id)
    
    if (error) throw error
    
    order.status = nextStatus
    toast.success(`Order status updated to ${nextStatus}`)
  } catch (error: any) {
    toast.error('Failed to update status')
    console.error(error)
  }
}

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'shipped':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'delivered':
      return 'bg-violet-500/20 text-violet-400 border-violet-500/30'
    case 'cancelled':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    default:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
}

// Format currency
const formatCurrency = (amount: number | null) => {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0)
}

// Format date
const formatDate = (date: string | null) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('el-GR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Orders</h1>
      <p class="text-slate-400">Manage and track customer orders</p>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by order number or status..."
          class="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50"
        />
      </div>
    </div>

    <!-- Orders Table -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>

    <div v-else-if="filteredOrders.length === 0" class="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
      <ShoppingBag class="mx-auto mb-4 h-12 w-12 text-slate-500" />
      <p class="text-slate-400">
        {{ searchQuery ? 'No orders match your search' : 'No orders yet' }}
      </p>
    </div>

    <div v-else class="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table class="min-w-[720px] w-full">
        <thead>
          <tr class="border-b border-white/10 text-left text-sm text-slate-400">
            <th class="px-6 py-4 font-medium">Order</th>
            <th class="px-6 py-4 font-medium">Date</th>
            <th class="px-6 py-4 font-medium">Total</th>
            <th class="px-6 py-4 font-medium">Status</th>
            <th class="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr
            v-for="order in paginatedOrders"
            :key="order.id"
            class="hover:bg-white/5"
          >
            <td class="px-6 py-4">
              <p class="font-medium text-white">
                #{{ order.order_number || order.id.slice(0, 8).toUpperCase() }}
              </p>
              <p class="text-sm text-slate-400">
                {{ order.items?.length || 0 }} item(s)
              </p>
            </td>
            <td class="px-6 py-4 text-slate-400">
              {{ formatDate(order.created_at) }}
            </td>
            <td class="px-6 py-4 font-medium text-white">
              {{ formatCurrency(order.total) }}
            </td>
            <td class="px-6 py-4">
              <button
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80',
                  getStatusColor(order.status || 'pending')
                ]"
                @click="handleStatusToggle(order)"
                title="Click to change status"
              >
                <span class="h-2 w-2 rounded-full bg-current" />
                {{ order.status || 'Pending' }}
              </button>
            </td>
            <td class="px-6 py-4 text-right">
              <button
                class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                @click="handleViewDetails(order)"
              >
                <Eye class="h-4 w-4" />
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-white/10 px-6 py-4">
        <p class="text-sm text-slate-400">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredOrders.length) }} of {{ filteredOrders.length }}
        </p>
        <div class="flex gap-2">
          <button
            :disabled="currentPage === 1"
            class="rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10 disabled:opacity-50"
            @click="currentPage--"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <button
            :disabled="currentPage === totalPages"
            class="rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10 disabled:opacity-50"
            @click="currentPage++"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <AdminOrderModal
      v-model:open="modalOpen"
      :order="selectedOrder"
    />
  </div>
</template>
