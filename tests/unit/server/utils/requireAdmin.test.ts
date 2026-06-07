import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createQueryBuilder } from '../../../fixtures/supabase'
import { requireAdmin } from '~/server/utils/requireAdmin'

const serverSupabaseUserMock = vi.mocked(serverSupabaseUser)
const serverSupabaseClientMock = vi.mocked(serverSupabaseClient)

describe('server/utils/requireAdmin', () => {
  const event = {} as never

  it('throws when no authenticated user is present', async () => {
    serverSupabaseUserMock.mockResolvedValue(null)

    await expect(requireAdmin(event)).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws when the profile is not admin', async () => {
    serverSupabaseUserMock.mockResolvedValue({ id: 'user-1' } as never)
    serverSupabaseClientMock.mockResolvedValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: { is_admin: false },
          error: null,
        }),
      ),
    } as never)

    await expect(requireAdmin(event)).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('allows admin users', async () => {
    serverSupabaseUserMock.mockResolvedValue({ id: 'admin-1' } as never)
    serverSupabaseClientMock.mockResolvedValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: { is_admin: true },
          error: null,
        }),
      ),
    } as never)

    await expect(requireAdmin(event)).resolves.toBeUndefined()
  })
})
