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
  ExternalLink,
  Trash2
} from 'lucide-vue-next'
import type { AdminNotification, NotificationType } from '~/composables/useNotifications'

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

const isOpen = ref(false)

// Toggle dropdown
function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    fetchNotifications()
  }
}

// Close dropdown
function close() {
  isOpen.value = false
}

// Handle click on notification
async function handleNotificationClick(notification: AdminNotification) {
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }
  
  if (notification.link) {
    close()
    navigateTo(notification.link)
  }
}

// Get icon component for notification type
function getTypeIconComponent(type: NotificationType) {
  const icons = {
    new_order: ShoppingBag,
    payment_failure: AlertCircle,
    low_stock: AlertTriangle,
    out_of_stock: Package,
    security_alert: ShieldAlert
  }
  return icons[type] || Bell
}

// Close on click outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.notification-dropdown-container')) {
      close()
    }
  })
})
</script>

<template>
  <div class="notification-dropdown-container relative">
    <!-- Bell Button -->
    <button
      @click.stop="toggle"
      class="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
    >
      <Bell class="h-5 w-5" />
      <!-- Unread Badge -->
      <span 
        v-if="unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white ring-2 ring-slate-900"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-96 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 p-4">
          <h3 class="text-sm font-semibold text-white">Notifications</h3>
          <div class="flex items-center gap-2">
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <CheckCheck class="h-3.5 w-3.5" />
              Mark all read
            </button>
            <NuxtLink
              to="/admin/notifications"
              @click="close"
              class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-violet-400 hover:bg-violet-500/10 transition-colors"
            >
              View all
              <ExternalLink class="h-3 w-3" />
            </NuxtLink>
          </div>
        </div>

        <!-- Notification List -->
        <div class="max-h-[400px] overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loading && notifications.length === 0" class="flex items-center justify-center py-12">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>

          <!-- Empty State -->
          <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <Bell class="h-10 w-10 text-slate-600 mb-3" />
            <p class="text-sm text-slate-400">No notifications yet</p>
            <p class="text-xs text-slate-500 mt-1">You'll see alerts here when they arrive</p>
          </div>

          <!-- Notification Items -->
          <div v-else class="divide-y divide-white/5">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              @click="handleNotificationClick(notification)"
              class="group flex items-start gap-3 p-4 cursor-pointer transition-colors"
              :class="[
                notification.is_read 
                  ? 'hover:bg-white/5' 
                  : 'bg-violet-500/5 hover:bg-violet-500/10'
              ]"
            >
              <!-- Icon -->
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                :class="notification.is_read ? 'bg-slate-800' : 'bg-slate-800/80'"
              >
                <component 
                  :is="getTypeIconComponent(notification.type)" 
                  class="h-4 w-4"
                  :class="getTypeColor(notification.type)"
                />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p 
                    class="text-sm font-medium truncate"
                    :class="notification.is_read ? 'text-slate-300' : 'text-white'"
                  >
                    {{ notification.title }}
                  </p>
                  <!-- Unread indicator -->
                  <span 
                    v-if="!notification.is_read"
                    class="h-2 w-2 rounded-full bg-violet-500 shrink-0"
                  />
                </div>
                <p class="mt-0.5 text-xs text-slate-400 line-clamp-2">
                  {{ notification.message }}
                </p>
                <div class="mt-2 flex items-center gap-2">
                  <span 
                    class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border"
                    :class="getPriorityColor(notification.priority)"
                  >
                    {{ notification.priority }}
                  </span>
                  <span class="text-[10px] text-slate-500">
                    {{ formatRelativeTime(notification.created_at) }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  v-if="!notification.is_read"
                  @click.stop="markAsRead(notification.id)"
                  class="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                  title="Mark as read"
                >
                  <Check class="h-3.5 w-3.5" />
                </button>
                <button
                  @click.stop="deleteNotification(notification.id)"
                  class="rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-white/10 p-3">
          <NuxtLink
            to="/admin/notifications"
            @click="close"
            class="flex items-center justify-center gap-2 w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            See all notifications
            <ExternalLink class="h-4 w-4" />
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>
