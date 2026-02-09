
import { toast } from 'vue-sonner'

export type NotificationType = 
  | 'new_order' 
  | 'payment_failure' 
  | 'low_stock' 
  | 'out_of_stock' 
  | 'security_alert'

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface AdminNotification {
  id: string
  admin_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  priority: NotificationPriority
  is_read: boolean
  related_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export function useNotifications() {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  
  const notifications = ref<AdminNotification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const channel = ref<ReturnType<typeof client.channel> | null>(null)

  // Fetch notifications
  async function fetchNotifications(limit = 20) {
    if (!user.value) return

    loading.value = true
    try {
      const { data, error } = await client
        .from('admin_notifications')
        .select('*')
        .eq('admin_id', user.value.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      notifications.value = (data as AdminNotification[]) || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      loading.value = false
    }
  }

  // Get unread count
  async function fetchUnreadCount() {
    if (!user.value) return

    try {
      const { count, error } = await client
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', user.value.id)
        .eq('is_read', false)

      if (error) throw error
      unreadCount.value = count || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Mark single notification as read
  async function markAsRead(notificationId: string) {
    try {
      const { error } = await client
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        notification.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    if (!user.value) return

    try {
      const { error } = await client
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('admin_id', user.value.id)
        .eq('is_read', false)

      if (error) throw error

      // Update local state
      notifications.value.forEach(n => {
        n.is_read = true
      })
      unreadCount.value = 0
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Delete a notification
  async function deleteNotification(notificationId: string) {
    try {
      const notification = notifications.value.find(n => n.id === notificationId)
      
      const { error } = await client
        .from('admin_notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      notifications.value = notifications.value.filter(n => n.id !== notificationId)
      if (notification && !notification.is_read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Delete multiple notifications
  async function deleteNotifications(notificationIds: string[]) {
    try {
      const unreadToDelete = notifications.value.filter(
        n => notificationIds.includes(n.id) && !n.is_read
      ).length

      const { error } = await client
        .from('admin_notifications')
        .delete()
        .in('id', notificationIds)

      if (error) throw error

      // Update local state
      notifications.value = notifications.value.filter(n => !notificationIds.includes(n.id))
      unreadCount.value = Math.max(0, unreadCount.value - unreadToDelete)
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  // Subscribe to real-time updates
  function subscribeToRealtime() {
    if (!user.value || channel.value) return

    channel.value = client
      .channel('admin_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
          filter: `admin_id=eq.${user.value.id}`
        },
        (payload) => {
          const newNotification = payload.new as AdminNotification
          
          // Add to the beginning of the list
          notifications.value.unshift(newNotification)
          
          // Increment unread count
          if (!newNotification.is_read) {
            unreadCount.value++
          }

          // Show toast for critical/high priority notifications
          if (newNotification.priority === 'critical' || newNotification.priority === 'high') {
            showNotificationToast(newNotification)
          }
        }
      )
      .subscribe()
  }

  // Show toast notification
  function showNotificationToast(notification: AdminNotification) {
    const typeIcons: Record<NotificationType, string> = {
      new_order: '🛍️',
      payment_failure: '❌',
      low_stock: '⚠️',
      out_of_stock: '📦',
      security_alert: '🔒'
    }

    toast(`${typeIcons[notification.type]} ${notification.title}`, {
      description: notification.message,
      duration: 8000
    })
  }

  // Unsubscribe from realtime
  function unsubscribe() {
    if (channel.value) {
      client.removeChannel(channel.value)
      channel.value = null
    }
  }

  // Get icon for notification type
  function getTypeIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      new_order: 'shopping-bag',
      payment_failure: 'alert-circle',
      low_stock: 'alert-triangle',
      out_of_stock: 'package-x',
      security_alert: 'shield-alert'
    }
    return icons[type] || 'bell'
  }

  // Get color for notification type
  function getTypeColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      new_order: 'text-green-400',
      payment_failure: 'text-red-400',
      low_stock: 'text-amber-400',
      out_of_stock: 'text-orange-400',
      security_alert: 'text-red-500'
    }
    return colors[type] || 'text-violet-400'
  }

  // Get priority badge color
  function getPriorityColor(priority: NotificationPriority): string {
    const colors: Record<NotificationPriority, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      low: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
    return colors[priority] || colors.medium
  }

  // Format relative time
  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  // Initialize on mount
  onMounted(() => {
    if (user.value) {
      fetchNotifications()
      fetchUnreadCount()
      subscribeToRealtime()
    }
  })

  // Watch for user changes
  watch(user, (newUser) => {
    if (newUser) {
      fetchNotifications()
      fetchUnreadCount()
      subscribeToRealtime()
    } else {
      unsubscribe()
      notifications.value = []
      unreadCount.value = 0
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotifications,
    getTypeIcon,
    getTypeColor,
    getPriorityColor,
    formatRelativeTime
  }
}
