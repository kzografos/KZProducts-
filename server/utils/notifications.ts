import type { Database, Json } from '~/types/database.types'

// Type definitions for notifications
export type NotificationType = 
  | 'new_order' 
  | 'payment_failure' 
  | 'low_stock' 
  | 'out_of_stock' 
  | 'security_alert'

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface CreateNotificationParams {
  type: NotificationType
  title: string
  message: string
  link?: string
  priority?: NotificationPriority
  relatedId?: string
  metadata?: Record<string, unknown>
}

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

/**
 * Get all admin user IDs from the profiles table
 */
export async function getAllAdminIds(client: ReturnType<typeof useSupabaseClient<Database>>): Promise<string[]> {
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('is_admin', true)

  if (error) {
    console.error('Error fetching admin IDs:', error)
    return []
  }

  return data?.map(profile => profile.id) || []
}

/**
 * Create a notification for all admin users
 */
export async function createNotification(
  client: ReturnType<typeof useSupabaseClient<Database>>,
  params: CreateNotificationParams
): Promise<AdminNotification[]> {
  const adminIds = await getAllAdminIds(client)
  
  if (adminIds.length === 0) {
    console.warn('No admin users found to notify')
    return []
  }

  const notifications = adminIds.map(adminId => ({
    admin_id: adminId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link || null,
    priority: params.priority || 'medium',
    related_id: params.relatedId || null,
    metadata: (params.metadata || {}) as unknown as Json,
    is_read: false
  }))

  const { data, error } = await client
    .from('admin_notifications')
    .insert(notifications)
    .select()

  if (error) {
    console.error('Error creating notifications:', error)
    return []
  }

  return (data as AdminNotification[]) || []
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  client: ReturnType<typeof useSupabaseClient<Database>>,
  notificationId: string
): Promise<boolean> {
  const { error } = await client
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

/**
 * Mark all notifications as read for an admin
 */
export async function markAllAsRead(
  client: ReturnType<typeof useSupabaseClient<Database>>,
  adminId: string
): Promise<boolean> {
  const { error } = await client
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('admin_id', adminId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }

  return true
}

/**
 * Get unread notification count for an admin
 */
export async function getUnreadCount(
  client: ReturnType<typeof useSupabaseClient<Database>>,
  adminId: string
): Promise<number> {
  const { count, error } = await client
    .from('admin_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', adminId)
    .eq('is_read', false)

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return count || 0
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  client: ReturnType<typeof useSupabaseClient<Database>>,
  notificationId: string
): Promise<boolean> {
  const { error } = await client
    .from('admin_notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    return false
  }

  return true
}

/**
 * Delete multiple notifications
 */
export async function deleteNotifications(
  client: ReturnType<typeof useSupabaseClient<Database>>,
  notificationIds: string[]
): Promise<boolean> {
  const { error } = await client
    .from('admin_notifications')
    .delete()
    .in('id', notificationIds)

  if (error) {
    console.error('Error deleting notifications:', error)
    return false
  }

  return true
}
