<script setup lang="ts">
import { Users, Search, Mail, Calendar, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Database } from '~/types/database.types'

type CustomerProfile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'full_name' | 'email' | 'created_at' | 'is_admin'
>

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient<Database>()

// State
const customers = ref<CustomerProfile[]>([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 10

// Fetch customers
const fetchCustomers = async () => {
  loading.value = true
  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, email, created_at, is_admin')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    customers.value = (data as CustomerProfile[] | null) || []
  } catch (error: any) {
    toast.error('Failed to load customers')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// Filtered customers
const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const query = searchQuery.value.toLowerCase()
  return customers.value.filter(customer => 
    customer.full_name?.toLowerCase().includes(query) ||
    customer.email?.toLowerCase().includes(query)
  )
})

// Paginated customers
const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCustomers.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / pageSize))

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
  fetchCustomers()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Customers</h1>
      <p class="text-slate-400">View and manage your customers</p>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative">
        <Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email..."
          class="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50"
        />
      </div>
    </div>

    <!-- Customers Table -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>

    <div v-else-if="filteredCustomers.length === 0" class="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
      <Users class="mx-auto mb-4 h-12 w-12 text-slate-500" />
      <p class="text-slate-400">
        {{ searchQuery ? 'No customers match your search' : 'No customers yet' }}
      </p>
    </div>

    <div v-else class="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table class="min-w-[680px] w-full">
        <thead>
          <tr class="border-b border-white/10 text-left text-sm text-slate-400">
            <th class="px-6 py-4 font-medium">Customer</th>
            <th class="px-6 py-4 font-medium">Email</th>
            <th class="px-6 py-4 font-medium">Joined</th>
            <th class="px-6 py-4 font-medium">Role</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr
            v-for="customer in paginatedCustomers"
            :key="customer.id"
            class="hover:bg-white/5"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
                  {{ customer.full_name?.charAt(0)?.toUpperCase() || '?' }}
                </div>
                <span class="font-medium text-white">
                  {{ customer.full_name || 'No name' }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2 text-slate-400">
                <Mail class="h-4 w-4" />
                {{ customer.email || '-' }}
              </div>
            </td>
            <td class="px-6 py-4 text-slate-400">
              <div class="flex items-center gap-2">
                <Calendar class="h-4 w-4" />
                {{ formatDate(customer.created_at) }}
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                  customer.is_admin
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-slate-500/20 text-slate-400'
                ]"
              >
                {{ customer.is_admin ? 'Admin' : 'Customer' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-white/10 px-6 py-4">
        <p class="text-sm text-slate-400">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredCustomers.length) }} of {{ filteredCustomers.length }}
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
  </div>
</template>
