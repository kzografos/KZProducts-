import { navigateTo, ref, useSupabaseClient, useSupabaseUser } from '#imports'
import { createQueryBuilder } from '../../fixtures/supabase'
import adminMiddleware from '~/middleware/admin'

describe('middleware/admin', () => {
  const useSupabaseUserMock = vi.mocked(useSupabaseUser)
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)
  const navigateToMock = vi.mocked(navigateTo)

  it('redirects anonymous users to login', async () => {
    useSupabaseUserMock.mockReturnValue(ref(null))

    await expect(adminMiddleware({} as never, {} as never)).resolves.toBe('/auth/login')
  })

  it('redirects non-admin users to the home page', async () => {
    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' }))
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: { is_admin: false },
          error: null,
        }),
      ),
    })

    await expect(adminMiddleware({} as never, {} as never)).resolves.toBe('/')
  })

  it('allows admin users to continue', async () => {
    useSupabaseUserMock.mockReturnValue(ref({ id: 'admin-1' }))
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: { is_admin: true },
          error: null,
        }),
      ),
    })

    await expect(adminMiddleware({} as never, {} as never)).resolves.toBeUndefined()
  })

  it('redirects to the home page when profile loading returns an error', async () => {
    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' }))
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: null,
          error: { message: 'profile lookup failed' },
        }),
      ),
    })

    await expect(adminMiddleware({} as never, {} as never)).resolves.toBe('/')
  })

  it('redirects to the home page when the profile lookup throws unexpectedly', async () => {
    const failingQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    }
    failingQuery.select.mockReturnValue(failingQuery)
    failingQuery.eq.mockReturnValue(failingQuery)
    failingQuery.single.mockRejectedValue(new Error('boom'))

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' }))
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => failingQuery),
    })

    await expect(adminMiddleware({} as never, {} as never)).resolves.toBe('/')
  })
})
