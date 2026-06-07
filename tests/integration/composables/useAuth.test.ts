import { ref, useSupabaseClient, useSupabaseUser } from '#imports'
import { createQueryBuilder } from '../../fixtures/supabase'
import { useAuth } from '~/composables/useAuth'

describe('composables/useAuth', () => {
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)
  const useSupabaseUserMock = vi.mocked(useSupabaseUser)

  it('fetches the profile and derives display helpers', async () => {
    useSupabaseUserMock.mockReturnValue(
      ref({
        id: 'user-1',
        email: 'jane@example.com',
        user_metadata: { full_name: 'Jane Doe' },
      } as never),
    )
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: {
            id: 'user-1',
            full_name: 'Jane Doe',
            email: 'jane@example.com',
            is_admin: false,
          },
          error: null,
        }),
      ),
    } as never)

    const auth = useAuth()
    await auth.fetchProfile()

    expect(auth.profile.value?.full_name).toBe('Jane Doe')
    expect(auth.displayName.value).toBe('Jane Doe')
    expect(auth.initials.value).toBe('JD')
  })

  it('updates the profile for authenticated users', async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: {
            id: 'user-1',
            full_name: 'Jane Doe',
            email: 'jane@example.com',
            is_admin: false,
          },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: {
            id: 'user-1',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
            is_admin: false,
          },
          error: null,
        }),
      )

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1', email: 'jane@example.com' } as never))
    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)

    const auth = useAuth()
    const result = await auth.updateProfile({ full_name: 'Jane Smith' })

    expect(result.error).toBeNull()
    expect(auth.profile.value?.full_name).toBe('Jane Smith')
  })

  it('returns an auth error when updating without a user', async () => {
    useSupabaseUserMock.mockReturnValue(ref(null))
    useSupabaseClientMock.mockReturnValue({ from: vi.fn() } as never)

    const auth = useAuth()
    const result = await auth.updateProfile({ full_name: 'Guest' })

    expect(result.error).toBeInstanceOf(Error)
  })
})
