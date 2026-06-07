import { getHeader, readBody } from '#imports'
import { serverSupabaseServiceRole } from '#supabase/server'
import trackFailedAttemptHandler from '~/server/api/auth/track-failed-attempt.post'
import { createQueryBuilder } from '../../../fixtures/supabase'

describe('server/api/auth/track-failed-attempt.post', () => {
  const getHeaderMock = vi.mocked(getHeader)
  const readBodyMock = vi.mocked(readBody)
  const serverSupabaseServiceRoleMock = vi.mocked(serverSupabaseServiceRole)

  it('records failed attempts and returns without alerts below the threshold', async () => {
    const insertAttemptQuery = createQueryBuilder({ error: null })
    const countAttemptsQuery = createQueryBuilder({ count: 2, error: null })
    let loginAttemptsCallCount = 0

    serverSupabaseServiceRoleMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'login_attempts') {
          loginAttemptsCallCount += 1
          return loginAttemptsCallCount === 1 ? insertAttemptQuery : countAttemptsQuery
        }

        return createQueryBuilder({ data: null, error: null })
      }),
    } as never)
    readBodyMock.mockResolvedValue({ email: 'security@example.com' } as never)
    getHeaderMock.mockImplementation((_event, header) =>
      header === 'x-forwarded-for' ? '198.51.100.1, 198.51.100.2' : undefined,
    )

    const result = await trackFailedAttemptHandler({} as never)

    expect(insertAttemptQuery.insert).toHaveBeenCalledWith({
      ip_address: '198.51.100.1',
      user_email: 'security@example.com',
      success: false,
    })
    expect(result).toEqual({ tracked: true, alertTriggered: false })
  })

  it('creates critical admin notifications after five failed attempts', async () => {
    const insertAttemptQuery = createQueryBuilder({ error: null })
    const countAttemptsQuery = createQueryBuilder({ count: 5, error: null })
    const adminsQuery = createQueryBuilder({
      data: [{ id: 'admin-1' }, { id: 'admin-2' }],
      error: null,
    })
    const insertNotificationsQuery = createQueryBuilder({ error: null })
    let loginAttemptsCallCount = 0

    serverSupabaseServiceRoleMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'login_attempts') {
          loginAttemptsCallCount += 1
          return loginAttemptsCallCount === 1 ? insertAttemptQuery : countAttemptsQuery
        }

        if (table === 'profiles') {
          return adminsQuery
        }

        if (table === 'admin_notifications') {
          return insertNotificationsQuery
        }

        return createQueryBuilder({ data: null, error: null })
      }),
    } as never)
    readBodyMock.mockResolvedValue({ email: 'security@example.com' } as never)
    getHeaderMock.mockImplementation((_event, header) =>
      header === 'x-real-ip' ? '203.0.113.5' : undefined,
    )

    const result = await trackFailedAttemptHandler({} as never)

    expect(insertNotificationsQuery.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        admin_id: 'admin-1',
        type: 'security_alert',
        priority: 'critical',
      }),
      expect.objectContaining({
        admin_id: 'admin-2',
        metadata: expect.objectContaining({
          ip_address: '203.0.113.5',
          attempt_count: 5,
          last_email: 'security@example.com',
        }),
      }),
    ])
    expect(result).toEqual({ tracked: true, alertTriggered: true })
  })

  it('requires an email address', async () => {
    readBodyMock.mockResolvedValue({} as never)

    await expect(trackFailedAttemptHandler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  })

  it('returns a tracked response when counting attempts fails', async () => {
    const insertAttemptQuery = createQueryBuilder({ error: null })
    const countAttemptsQuery = createQueryBuilder({
      count: 0,
      error: { message: 'count failed' },
    })
    let loginAttemptsCallCount = 0

    serverSupabaseServiceRoleMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'login_attempts') {
          loginAttemptsCallCount += 1
          return loginAttemptsCallCount === 1 ? insertAttemptQuery : countAttemptsQuery
        }

        return createQueryBuilder({ data: null, error: null })
      }),
    } as never)
    readBodyMock.mockResolvedValue({ email: 'security@example.com' } as never)
    getHeaderMock.mockReturnValue('198.51.100.99')

    const result = await trackFailedAttemptHandler({} as never)

    expect(result).toEqual({ tracked: true })
  })

  it('returns without alerts when admin lookup fails after the threshold is reached', async () => {
    const insertAttemptQuery = createQueryBuilder({ error: null })
    const countAttemptsQuery = createQueryBuilder({ count: 5, error: null })
    const adminsQuery = createQueryBuilder({
      data: null,
      error: { message: 'admin lookup failed' },
    })
    let loginAttemptsCallCount = 0

    serverSupabaseServiceRoleMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'login_attempts') {
          loginAttemptsCallCount += 1
          return loginAttemptsCallCount === 1 ? insertAttemptQuery : countAttemptsQuery
        }

        if (table === 'profiles') {
          return adminsQuery
        }

        return createQueryBuilder({ data: null, error: null })
      }),
    } as never)
    readBodyMock.mockResolvedValue({ email: 'security@example.com' } as never)
    getHeaderMock.mockReturnValue('203.0.113.10')

    const result = await trackFailedAttemptHandler({} as never)

    expect(result).toEqual({ tracked: true, alertTriggered: false })
  })
})
