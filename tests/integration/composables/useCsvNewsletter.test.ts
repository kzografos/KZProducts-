vi.mock('~/utils/csvUtils', async () => {
  const actual = await vi.importActual<typeof import('~/utils/csvUtils')>('~/utils/csvUtils')
  return {
    ...actual,
    downloadFile: vi.fn(),
  }
})

import { useSupabaseClient } from '#imports'
import { downloadFile } from '~/utils/csvUtils'
import { useCsvNewsletter } from '~/composables/useCsvNewsletter'
import { createQueryBuilder } from '../../fixtures/supabase'

describe('composables/useCsvNewsletter', () => {
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)
  const downloadFileMock = vi.mocked(downloadFile)

  it('exports subscribers to CSV', async () => {
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: [
            {
              id: 'sub-1',
              email: 'newsletter@example.com',
              subscribed_at: '2026-01-01T00:00:00.000Z',
              is_active: true,
            },
          ],
          error: null,
        }),
      ),
    } as never)

    const newsletter = useCsvNewsletter()
    const result = await newsletter.exportSubscribersToCsv()

    expect(result).toEqual({ success: true, count: 1 })
    expect(downloadFileMock).toHaveBeenCalled()
  })

  it('throws when there are no subscribers to export', async () => {
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: [],
          error: null,
        }),
      ),
    } as never)

    const newsletter = useCsvNewsletter()

    await expect(newsletter.exportSubscribersToCsv()).rejects.toThrow('No subscribers to export')
  })
})
