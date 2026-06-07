<script setup lang="ts">
import { Search, Download, ChevronLeft, ChevronRight, Users } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

// Define inline type until database.types.ts is regenerated
interface NewsletterSubscriber {
  id: string
  email: string
  subscribed_at: string
  is_active: boolean
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient()
const { loading: csvLoading, exportSubscribersToCsv } = useCsvNewsletter()

// State
const subscribers = ref<NewsletterSubscriber[]>([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 20
const totalCount = ref(0)

// Computed
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

// Fetch subscribers
const fetchSubscribers = async () => {
  loading.value = true
  
  try {
    let query = client
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' })
      .order('subscribed_at', { ascending: false })
      .range((currentPage.value - 1) * pageSize, currentPage.value * pageSize - 1)

    if (searchQuery.value.trim()) {
      query = query.ilike('email', `%${searchQuery.value.trim()}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    subscribers.value = (data || []) as NewsletterSubscriber[]
    totalCount.value = count || 0
  } catch (error: any) {
    console.error('Failed to fetch subscribers:', error)
    toast.error('Failed to load subscribers')
  } finally {
    loading.value = false
  }
}

// Toggle subscriber status
const toggleStatus = async (subscriber: NewsletterSubscriber) => {
  const newStatus = !subscriber.is_active
  
  try {
    const { error } = await client
      .from('newsletter_subscribers')
      .update({ is_active: newStatus })
      .eq('id', subscriber.id)

    if (error) throw error

    subscriber.is_active = newStatus
    toast.success(newStatus ? 'Subscriber activated' : 'Subscriber deactivated')
  } catch (error: any) {
    console.error('Failed to update subscriber:', error)
    toast.error('Failed to update subscriber status')
  }
}

// Handle search
const handleSearch = () => {
  currentPage.value = 1
  fetchSubscribers()
}

// Handle CSV export
const handleExport = async () => {
  try {
    const result = await exportSubscribersToCsv()
    toast.success(`Exported ${result.count} subscribers to CSV`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to export subscribers')
  }
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Watch for page changes
watch(currentPage, fetchSubscribers)

// Initial fetch
onMounted(fetchSubscribers)
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Newsletter Subscribers</h1>
        <p class="mt-1 text-slate-400">
          {{ totalCount }} total subscriber{{ totalCount !== 1 ? 's' : '' }}
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-600 hover:shadow-violet-500/40 disabled:opacity-50"
        :disabled="csvLoading || totalCount === 0"
        @click="handleExport"
      >
        <Download class="h-5 w-5" />
        Export CSV
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div class="flex flex-col gap-4 sm:flex-row">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by email..."
            class="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-white placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            @keyup.enter="handleSearch"
          />
        </div>
        <button
          class="rounded-xl bg-white/5 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/10"
          @click="handleSearch"
        >
          Search
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <!-- Loading state -->
      <div v-if="loading" class="p-8">
        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="flex items-center justify-between animate-pulse">
            <div class="space-y-1">
              <div class="h-4 w-48 rounded bg-white/10" />
              <div class="h-3 w-24 rounded bg-white/10" />
            </div>
            <div class="h-6 w-16 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="subscribers.length === 0" class="p-12 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
          <Users class="h-8 w-8 text-slate-500" />
        </div>
        <h3 class="mb-2 text-lg font-semibold text-white">No subscribers yet</h3>
        <p class="text-slate-400">
          {{ searchQuery ? 'No subscribers match your search.' : 'Newsletter subscribers will appear here.' }}
        </p>
      </div>

      <!-- Table -->
      <table v-else class="min-w-[560px] w-full">
        <thead class="border-b border-white/10 bg-white/5">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email
            </th>
            <th class="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">
              Subscribed
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr
            v-for="subscriber in subscribers"
            :key="subscriber.id"
            class="transition-colors hover:bg-white/5"
          >
            <!-- Email -->
            <td class="px-6 py-4">
              <span class="font-medium text-white">{{ subscriber.email }}</span>
            </td>

            <!-- Subscribed Date -->
            <td class="hidden px-6 py-4 text-slate-400 sm:table-cell">
              {{ formatDate(subscriber.subscribed_at) }}
            </td>

            <!-- Status -->
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                  subscriber.is_active
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-500/20 text-slate-400'
                ]"
              >
                {{ subscriber.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 text-right">
              <button
                class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                :class="[
                  subscriber.is_active
                    ? 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                ]"
                @click="toggleStatus(subscriber)"
              >
                {{ subscriber.is_active ? 'Deactivate' : 'Activate' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between border-t border-white/10 px-6 py-4"
      >
        <p class="text-sm text-slate-400">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }}
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage === 1"
            class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-50"
            @click="currentPage--"
          >
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="px-3 text-sm text-slate-300">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button
            :disabled="currentPage === totalPages"
            class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 disabled:opacity-50"
            @click="currentPage++"
          >
            <ChevronRight class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
