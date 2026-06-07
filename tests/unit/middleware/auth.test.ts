import { navigateTo, ref, useSupabaseUser } from '#imports'
import authMiddleware from '~/middleware/auth'

describe('middleware/auth', () => {
  const useSupabaseUserMock = vi.mocked(useSupabaseUser)
  const navigateToMock = vi.mocked(navigateTo)

  it('redirects anonymous users to login', () => {
    useSupabaseUserMock.mockReturnValue(ref(null))

    expect(authMiddleware({} as never, {} as never)).toBe('/auth/login')
  })

  it('allows authenticated users through', () => {
    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' }))

    expect(authMiddleware({} as never, {} as never)).toBeUndefined()
  })
})
