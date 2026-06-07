import { navigateTo, ref, useSupabaseUser } from '#imports'
import guestMiddleware from '~/middleware/guest'

describe('middleware/guest', () => {
  const useSupabaseUserMock = vi.mocked(useSupabaseUser)
  const navigateToMock = vi.mocked(navigateTo)

  it('redirects authenticated users away from guest pages', () => {
    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' }))

    expect(guestMiddleware({} as never, {} as never)).toBe('/')
  })

  it('allows anonymous users to stay on guest routes', () => {
    useSupabaseUserMock.mockReturnValue(ref(null))

    expect(guestMiddleware({} as never, {} as never)).toBeUndefined()
  })
})
