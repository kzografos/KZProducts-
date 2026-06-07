vi.mock('vue-sonner', () => ({
  toast: vi.fn(),
}))

import { toast } from 'vue-sonner'
import { nextTick, ref, useSupabaseClient, useSupabaseUser } from '#imports'
import { createQueryBuilder } from '../../fixtures/supabase'
import { useNotifications } from '~/composables/useNotifications'

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('composables/useNotifications', () => {
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)
  const useSupabaseUserMock = vi.mocked(useSupabaseUser)
  const toastMock = vi.mocked(toast)

  it('loads notifications, unread counts, and reacts to realtime inserts', async () => {
    let insertHandler: ((payload: { new: Record<string, unknown> }) => void) | undefined
    const notificationsQuery = createQueryBuilder({
      data: [
        {
          id: 'notif-1',
          admin_id: 'admin-1',
          type: 'new_order',
          title: 'New Order',
          message: 'Order #1001 paid',
          link: '/admin/orders',
          priority: 'high',
          is_read: false,
          related_id: null,
          metadata: {},
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      error: null,
    })
    const countQuery = createQueryBuilder({ count: 1, error: null })
    const updateQuery = createQueryBuilder({ data: null, error: null })
    const channelInstance = {
      on: vi.fn((_event, _filter, callback) => {
        insertHandler = callback
        return channelInstance
      }),
      subscribe: vi.fn(() => channelInstance),
    }

    useSupabaseUserMock.mockReturnValue(ref({ id: 'admin-1' } as never))
    useSupabaseClientMock.mockReturnValue({
      from: vi
        .fn()
        .mockReturnValueOnce(notificationsQuery)
        .mockReturnValueOnce(countQuery)
        .mockReturnValueOnce(updateQuery),
      channel: vi.fn(() => channelInstance),
      removeChannel: vi.fn(),
    } as never)

    const notifications = useNotifications()
    await flushPromises()

    expect(notifications.notifications.value).toHaveLength(1)
    expect(notifications.unreadCount.value).toBe(1)

    insertHandler?.({
      new: {
        id: 'notif-2',
        admin_id: 'admin-1',
        type: 'payment_failure',
        title: 'Payment Failed',
        message: 'Order #1002 failed',
        link: '/admin/orders',
        priority: 'critical',
        is_read: false,
        related_id: null,
        metadata: {},
        created_at: '2026-01-02T00:00:00.000Z',
      },
    })

    expect(notifications.notifications.value[0]?.id).toBe('notif-2')
    expect(notifications.unreadCount.value).toBe(2)
    expect(toastMock).toHaveBeenCalled()

    await notifications.markAsRead('notif-2')
    expect(notifications.notifications.value[0]?.is_read).toBe(true)
  })

  it('supports bulk actions, helper lookups, and clears state on logout', async () => {
    const user = ref({ id: 'admin-1' } as never)
    const notificationsQuery = createQueryBuilder({
      data: [
        {
          id: 'notif-1',
          admin_id: 'admin-1',
          type: 'new_order',
          title: 'New Order',
          message: 'Order #1001 paid',
          link: '/admin/orders',
          priority: 'high',
          is_read: false,
          related_id: null,
          metadata: {},
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'notif-2',
          admin_id: 'admin-1',
          type: 'low_stock',
          title: 'Low Stock',
          message: 'GPU inventory is running low',
          link: '/admin/products',
          priority: 'medium',
          is_read: true,
          related_id: null,
          metadata: {},
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      error: null,
    })
    const countQuery = createQueryBuilder({ count: 1, error: null })
    const deleteManyQuery = createQueryBuilder({ data: null, error: null })
    const markAllQuery = createQueryBuilder({ data: null, error: null })
    const deleteOneQuery = createQueryBuilder({ data: null, error: null })
    const channelInstance = {
      on: vi.fn(() => channelInstance),
      subscribe: vi.fn(() => channelInstance),
    }
    const removeChannel = vi.fn()

    useSupabaseUserMock.mockReturnValue(user)
    useSupabaseClientMock.mockReturnValue({
      from: vi
        .fn()
        .mockReturnValueOnce(notificationsQuery)
        .mockReturnValueOnce(countQuery)
        .mockReturnValueOnce(deleteManyQuery)
        .mockReturnValueOnce(markAllQuery)
        .mockReturnValueOnce(deleteOneQuery),
      channel: vi.fn(() => channelInstance),
      removeChannel,
    } as never)

    const notifications = useNotifications()
    await flushPromises()

    expect(notifications.getTypeIcon('security_alert')).toBe('shield-alert')
    expect(notifications.getTypeColor('payment_failure')).toBe('text-red-400')
    expect(notifications.getPriorityColor('low')).toContain('text-slate-400')
    expect(notifications.formatRelativeTime(new Date().toISOString())).toBe('Just now')
    expect(notifications.formatRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())).toBe(
      '2h ago',
    )

    await notifications.deleteNotifications(['notif-1'])
    expect(notifications.notifications.value).toHaveLength(1)
    expect(notifications.unreadCount.value).toBe(0)

    await notifications.markAllAsRead()
    expect(notifications.notifications.value.every(notification => notification.is_read)).toBe(true)

    await notifications.deleteNotification('notif-2')
    expect(notifications.notifications.value).toEqual([])

    user.value = null as never
    await nextTick()
    await flushPromises()

    expect(removeChannel).toHaveBeenCalledWith(channelInstance)
    expect(notifications.notifications.value).toEqual([])
    expect(notifications.unreadCount.value).toBe(0)
  })
})
