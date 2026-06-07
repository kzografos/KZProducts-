import { getRouterParam, readBody } from '#imports'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import createReviewHandler from '~/server/api/reviews/create.post'
import updateReviewHandler from '~/server/api/reviews/[id].patch'
import { createQueryBuilder } from '../../../fixtures/supabase'

describe('server/api/reviews/create.post', () => {
  const readBodyMock = vi.mocked(readBody)
  const serverSupabaseClientMock = vi.mocked(serverSupabaseClient)
  const serverSupabaseUserMock = vi.mocked(serverSupabaseUser)

  it('sanitizes and inserts a new review for the authenticated user', async () => {
    const reviewCountQuery = createQueryBuilder({ count: 1, error: null })
    const existingReviewQuery = createQueryBuilder({ data: null, error: null })
    const productLookupQuery = createQueryBuilder({ data: { id: 'product-1' }, error: null })
    const insertReviewQuery = createQueryBuilder({
      data: { id: 'review-1', user_id: 'user-1', product_id: 'product-1' },
      error: null,
    })
    let reviewsCallCount = 0

    serverSupabaseUserMock.mockResolvedValue({ id: 'user-1' } as never)
    serverSupabaseClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'reviews') {
          reviewsCallCount += 1
          return reviewsCallCount === 1
            ? reviewCountQuery
            : reviewsCallCount === 2
              ? existingReviewQuery
              : insertReviewQuery
        }

        if (table === 'products') {
          return productLookupQuery
        }

        return createQueryBuilder({ data: null, error: null })
      }),
    } as never)
    readBodyMock.mockResolvedValue({
      product_id: 'product-1',
      rating: '5',
      title: '<b>Elite Build</b>',
      comment: 'Loved the performance and cooling <script>alert(1)</script>',
    } as never)

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await createReviewHandler({} as never)

    expect(insertReviewQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        product_id: 'product-1',
        rating: 5,
        title: 'Elite Build',
        comment: 'Loved the performance and cooling',
      }),
    )
    expect(warnSpy).toHaveBeenCalled()
    expect(result).toMatchObject({
      id: 'review-1',
      user_id: 'user-1',
    })
  })

  it('rejects users who exceed the hourly review rate limit', async () => {
    serverSupabaseUserMock.mockResolvedValue({ id: 'user-1' } as never)
    serverSupabaseClientMock.mockResolvedValue({
      from: vi.fn(() => createQueryBuilder({ count: 5, error: null })),
    } as never)
    readBodyMock.mockResolvedValue({
      product_id: 'product-1',
      rating: '5',
      comment: 'Still great',
    } as never)

    await expect(createReviewHandler({} as never)).rejects.toMatchObject({
      statusCode: 429,
    })
  })
})

describe('server/api/reviews/[id].patch', () => {
  const getRouterParamMock = vi.mocked(getRouterParam)
  const readBodyMock = vi.mocked(readBody)
  const serverSupabaseClientMock = vi.mocked(serverSupabaseClient)
  const serverSupabaseUserMock = vi.mocked(serverSupabaseUser)

  it('updates the user review with sanitized content', async () => {
    const existingReviewQuery = createQueryBuilder({
      data: {
        id: 'review-1',
        user_id: 'user-1',
        product_id: 'product-1',
        rating: 5,
        title: 'Initial title',
        comment: 'Initial comment',
      },
      error: null,
    })
    const updateReviewQuery = createQueryBuilder({
      data: { id: 'review-1', rating: 4, title: null },
      error: null,
    })
    let reviewsCallCount = 0

    serverSupabaseUserMock.mockResolvedValue({ id: 'user-1' } as never)
    serverSupabaseClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'reviews') {
          reviewsCallCount += 1
          return reviewsCallCount === 1 ? existingReviewQuery : updateReviewQuery
        }

        return createQueryBuilder({ data: null, error: null })
      }),
    } as never)
    getRouterParamMock.mockReturnValue('review-1')
    readBodyMock.mockResolvedValue({
      rating: '4',
      title: '',
      comment: 'Updated <img src=x onerror=alert(1)> review with more detail',
    } as never)

    const result = await updateReviewHandler({} as never)

    expect(updateReviewQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 4,
        title: null,
        comment: 'Updated  review with more detail',
        updated_at: expect.any(String),
      }),
    )
    expect(result).toMatchObject({ id: 'review-1', rating: 4 })
  })

  it('blocks users from editing someone else’s review', async () => {
    serverSupabaseUserMock.mockResolvedValue({ id: 'user-1' } as never)
    serverSupabaseClientMock.mockResolvedValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: {
            id: 'review-1',
            user_id: 'user-2',
            product_id: 'product-1',
            rating: 5,
            title: 'Other review',
            comment: 'Other comment',
          },
          error: null,
        }),
      ),
    } as never)
    getRouterParamMock.mockReturnValue('review-1')
    readBodyMock.mockResolvedValue({ comment: 'Nope' } as never)

    await expect(updateReviewHandler({} as never)).rejects.toMatchObject({
      statusCode: 403,
      message: 'You can only edit your own reviews',
    })
  })
})
