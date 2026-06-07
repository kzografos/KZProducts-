<script setup lang="ts">
import { 
  Bell, 
  ShoppingBag, 
  AlertCircle, 
  AlertTriangle, 
  Package, 
  ShieldAlert,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-vue-next'
import type { AdminNotification, NotificationType, NotificationPriority } from '~/composables/useNotifications'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const {
  notifications,
  unreadCount,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getTypeColor,
  getPriorityColor,
  formatRelativeTime
} = useNotifications()

// Filter state
const typeFilter = ref<NotificationType | 'all'>('all')
const priorityFilter = ref<NotificationPriority | 'all'>('all')
const readFilter = ref<'all' | 'read' | 'unread'>('all')

// Filtered notifications
const filteredNotifications = computed(() => {
  return notifications.value.filter(n => {
    if (typeFilter.value !== 'all' && n.type !== typeFilter.value) return false
    if (priorityFilter.value !== 'all' && n.priority !== priorityFilter.value) return false
    if (readFilter.value === 'read' && !n.is_read) return false
    if (readFilter.value === 'unread' && n.is_read) return false
    return true
  })
})

// Icon mapping
function getTypeIcon(type: NotificationType) {
  const icons = {
    new_order: ShoppingBag,
    payment_failure: AlertCircle,
    low_stock: AlertTriangle,
    out_of_stock: Package,
    security_alert: ShieldAlert
  }
  return icons[type] || Bell
}

// Notification type labels
const typeLabels: Record<NotificationType, string> = {
  new_order: 'New Order',
  payment_failure: 'Payment Failed',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  security_alert: 'Security Alert'
}

// Priority labels
const priorityLabels: Record<NotificationPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
}

// Handle notification click
async function handleClick(notification: AdminNotification) {
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }
  
  if (notification.link) {
    navigateTo(notification.link)
  }
}

// Refresh
const isRefreshing = ref(false)
async function refresh() {
  isRefreshing.value = true
  await fetchNotifications()
  isRefreshing.value = false
}

onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Notifications</h1>
        <p class="mt-1 text-sm text-slate-400">
          Manage your admin notifications and alerts
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <button
          @click="refresh"
          class="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          :class="{ 'opacity-50': isRefreshing }"
          :disabled="isRefreshing"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isRefreshing }" />
          Refresh
        </button>
        
        <button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="flex items-center gap-2 rounded-lg bg-violet-500/10 px-4 py-2 text-sm text-violet-400 hover:bg-violet-500/20 transition-colors"
        >
          <CheckCheck class="h-4 w-4" />
          Mark all as read
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
            <Bell class="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ notifications.length }}</p>
            <p class="text-xs text-slate-400">Total</p>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
            <Bell class="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ unreadCount }}</p>
            <p class="text-xs text-slate-400">Unread</p>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
            <ShoppingBag class="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">
              {{ notifications.filter(n => n.type === 'new_order').length }}
            </p>
            <p class="text-xs text-slate-400">Orders</p>
          </div>
        </div>
      </div>
      
      <div class="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
            <ShieldAlert class="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">
              {{ notifications.filter(n => n.type === 'security_alert').length }}
            </p>
            <p class="text-xs text-slate-400">Alerts</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter class="h-4 w-4 text-slate-400" />
          <span class="text-sm text-slate-400">Filters:</span>
        </div>
        
        <!-- Type Filter -->
        <select
          v-model="typeFilter"
          class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
        >
          <option value="all">All Types</option>
          <option v-for="(label, type) in typeLabels" :key="type" :value="type">
            {{ label }}
          </option>
        </select>
        
        <!-- Priority Filter -->
        <select
          v-model="priorityFilter"
          class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option v-for="(label, priority) in priorityLabels" :key="priority" :value="priority">
            {{ label }}
          </option>
        </select>
        
        <!-- Read Filter -->
        <select
          v-model="readFilter"
          class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
        </select>
        
        <!-- Clear Filters -->
        <button
          v-if="typeFilter !== 'all' || priorityFilter !== 'all' || readFilter !== 'all'"
          @click="typeFilter = 'all'; priorityFilter = 'all'; readFilter = 'all'"
          class="text-sm text-violet-400 hover:text-violet-300"
        >
          Clear filters
        </button>
      </div>
    </div>

    <!-- Notification List -->
    <div class="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
      <!-- Loading -->
      <div v-if="loading && notifications.length === 0" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredNotifications.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <Bell class="h-12 w-12 text-slate-600 mb-4" />
        <p class="text-lg font-medium text-slate-300">No notifications</p>
        <p class="text-sm text-slate-500 mt-1">
          {{ typeFilter !== 'all' || priorityFilter !== 'all' || readFilter !== 'all' 
            ? 'Try adjusting your filters' 
            : 'You\'ll see alerts here when they arrive' 
          }}
        </p>
      </div>
      
      <!-- Notification Items -->
      <div v-else class="divide-y divide-white/5">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          @click="handleClick(notification)"
          class="group flex items-start gap-4 p-5 cursor-pointer transition-colors"
          :class="[
            notification.is_read 
              ? 'hover:bg-white/5' 
              : 'bg-violet-500/5 hover:bg-violet-500/10'
          ]"
        >
          <!-- Icon -->
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            :class="notification.is_read ? 'bg-slate-800' : 'bg-slate-800/80'"
          >
            <component 
              :is="getTypeIcon(notification.type)" 
              class="h-5 w-5"
              :class="getTypeColor(notification.type)"
            />
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <p 
                class="text-sm font-medium"
                :class="notification.is_read ? 'text-slate-300' : 'text-white'"
              >
                {{ notification.title }}
              </p>
              <span 
                v-if="!notification.is_read"
                class="h-2 w-2 rounded-full bg-violet-500 shrink-0"
              />
            </div>
            
            <p class="mt-1 text-sm text-slate-400 line-clamp-2">
              {{ notification.message }}
            </p>
            
            <div class="mt-3 flex items-center gap-3 flex-wrap">
              <span 
                class="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium border"
                :class="getPriorityColor(notification.priority)"
              >
                {{ notification.priority.toUpperCase() }}
              </span>
              
              <span class="inline-flex items-center rounded-lg bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                {{ typeLabels[notification.type] }}
              </span>
              
              <span class="text-xs text-slate-500">
                {{ formatRelativeTime(notification.created_at) }}
              </span>
              
              <NuxtLink
                v-if="notification.link"
                :to="notification.link"
                class="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                @click.stop
              >
                View details
                <ExternalLink class="h-3 w-3" />
              </NuxtLink>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex shrink-0 items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              v-if="!notification.is_read"
              @click.stop="markAsRead(notification.id)"
              class="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Mark as read"
            >
              <Check class="h-4 w-4" />
            </button>
            <button
              @click.stop="deleteNotification(notification.id)"
              class="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
