import {
  createNotification,
  deleteNotification,
  deleteNotifications,
  getAllAdminIds,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '~/server/utils/notifications'

describe('server/utils/notifications', () => {
  const createClient = () => ({
    from: vi.fn(),
  })

  it('returns admin IDs from the profiles table', async () => {
    const client = createClient()
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 'admin-1' }, { id: 'admin-2' }],
        error: null,
      }),
    }
    client.from.mockReturnValue(query)

    await expect(getAllAdminIds(client as never)).resolves.toEqual(['admin-1', 'admin-2'])
  })

  it('creates notifications for each admin', async () => {
    const client = createClient()
    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 'admin-1' }, { id: 'admin-2' }],
        error: null,
      }),
    }
    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [
          { id: 'notif-1', admin_id: 'admin-1', is_read: false },
          { id: 'notif-2', admin_id: 'admin-2', is_read: false },
        ],
        error: null,
      }),
    }

    client.from
      .mockReturnValueOnce(profilesQuery)
      .mockReturnValueOnce(insertQuery)

    const notifications = await createNotification(client as never, {
      type: 'new_order',
      title: 'New Order',
      message: 'Order #1001 was paid.',
      priority: 'high',
    })

    expect(notifications).toHaveLength(2)
    expect(insertQuery.insert).toHaveBeenCalled()
  })

  it('marks notifications as read and deletes them', async () => {
    const client = createClient()
    const updateQuery = {
      update: vi.fn(),
      eq: vi.fn(),
    }
    updateQuery.update.mockReturnValue(updateQuery)
    updateQuery.eq.mockReturnValue(updateQuery)
    ;(updateQuery as { then?: typeof Promise.resolve }).then = (onFulfilled: (value: { error: null; count: number }) => unknown) =>
      Promise.resolve({ error: null, count: 3 }).then(onFulfilled)

    const deleteQuery = {
      delete: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
    }
    deleteQuery.delete.mockReturnValue(deleteQuery)
    deleteQuery.eq.mockReturnValue(deleteQuery)
    deleteQuery.in.mockReturnValue(deleteQuery)
    ;(deleteQuery as { then?: typeof Promise.resolve }).then = (onFulfilled: (value: { error: null }) => unknown) =>
      Promise.resolve({ error: null }).then(onFulfilled)

    client.from
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(deleteQuery)
      .mockReturnValueOnce(deleteQuery)

    await expect(markAsRead(client as never, 'notif-1')).resolves.toBe(true)
    await expect(markAllAsRead(client as never, 'admin-1')).resolves.toBe(true)
    await expect(deleteNotification(client as never, 'notif-1')).resolves.toBe(true)
    await expect(deleteNotifications(client as never, ['notif-1', 'notif-2'])).resolves.toBe(true)
  })

  it('returns the unread count for an admin', async () => {
    const client = createClient()
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    ;(query as { then?: typeof Promise.resolve }).then = (onFulfilled: (value: { count: number; error: null }) => unknown) =>
      Promise.resolve({ count: 4, error: null }).then(onFulfilled)
    client.from.mockReturnValue(query)

    await expect(getUnreadCount(client as never, 'admin-1')).resolves.toBe(4)
  })

  it('returns safe fallbacks when admin discovery and notification writes fail', async () => {
    const client = createClient()
    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'profiles failed' },
      }),
    }

    client.from.mockReturnValue(profilesQuery)

    await expect(getAllAdminIds(client as never)).resolves.toEqual([])
    await expect(
      createNotification(client as never, {
        type: 'security_alert',
        title: 'Security Alert',
        message: 'Something happened.',
      }),
    ).resolves.toEqual([])
  })

  it('returns safe fallbacks when update, count, and delete operations fail', async () => {
    const client = createClient()
    const updateQuery = {
      update: vi.fn(),
      eq: vi.fn(),
    }
    updateQuery.update.mockReturnValue(updateQuery)
    updateQuery.eq.mockReturnValue(updateQuery)
    ;(updateQuery as { then?: typeof Promise.resolve }).then = (
      onFulfilled: (value: { error: { message: string } }) => unknown,
    ) => Promise.resolve({ error: { message: 'update failed' } }).then(onFulfilled)

    const countQuery = {
      select: vi.fn(),
      eq: vi.fn(),
    }
    countQuery.select.mockReturnValue(countQuery)
    countQuery.eq.mockReturnValue(countQuery)
    ;(countQuery as { then?: typeof Promise.resolve }).then = (
      onFulfilled: (value: { count: number; error: { message: string } }) => unknown,
    ) => Promise.resolve({ count: 0, error: { message: 'count failed' } }).then(onFulfilled)

    const deleteQuery = {
      delete: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
    }
    deleteQuery.delete.mockReturnValue(deleteQuery)
    deleteQuery.eq.mockReturnValue(deleteQuery)
    deleteQuery.in.mockReturnValue(deleteQuery)
    ;(deleteQuery as { then?: typeof Promise.resolve }).then = (
      onFulfilled: (value: { error: { message: string } }) => unknown,
    ) => Promise.resolve({ error: { message: 'delete failed' } }).then(onFulfilled)

    client.from
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(updateQuery)
      .mockReturnValueOnce(countQuery)
      .mockReturnValueOnce(deleteQuery)
      .mockReturnValueOnce(deleteQuery)

    await expect(markAsRead(client as never, 'notif-1')).resolves.toBe(false)
    await expect(markAllAsRead(client as never, 'admin-1')).resolves.toBe(false)
    await expect(getUnreadCount(client as never, 'admin-1')).resolves.toBe(0)
    await expect(deleteNotification(client as never, 'notif-1')).resolves.toBe(false)
    await expect(deleteNotifications(client as never, ['notif-1'])).resolves.toBe(false)
  })
})
