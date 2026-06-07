import { $fetch, ref, useSupabaseClient, useSupabaseUser } from '#imports'
import { createQueryBuilder } from '../../fixtures/supabase'
import { useReviews } from '~/composables/useReviews'

describe('composables/useReviews', () => {
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)
  const useSupabaseUserMock = vi.mocked(useSupabaseUser)
  const fetchMock = vi.mocked($fetch)

  it('enriches product reviews with helpful votes and verified purchases', async () => {
    let reviewHelpfulCall = 0
    const fromMock = vi.fn((table: string) => {
      if (table === 'reviews') {
        return createQueryBuilder({
          data: [
            {
              id: 'review-1',
              user_id: 'user-2',
              product_id: 'product-1',
              rating: 5,
              comment: 'Great component for a high-end build.',
              title: 'Excellent',
              review_responses: {
                id: 'response-1',
                response: 'Thanks for the review!',
                created_at: null,
                profiles: { full_name: 'Admin' },
              },
              profiles: {
                full_name: 'Jane Doe',
                avatar_id: null,
              },
            },
          ],
          error: null,
        })
      }

      if (table === 'review_helpful_votes') {
        reviewHelpfulCall += 1
        return createQueryBuilder({
          data:
            reviewHelpfulCall === 1
              ? [{ review_id: 'review-1' }, { review_id: 'review-1' }]
              : [{ review_id: 'review-1' }],
          error: null,
        })
      }

      return createQueryBuilder({ data: null, error: null })
    })

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({
      from: fromMock,
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    } as never)

    const reviews = useReviews()
    const result = await reviews.fetchProductReviews('product-1', 'helpful')

    expect(result[0]?.helpful_count).toBe(2)
    expect(result[0]?.user_has_voted).toBe(true)
    expect(result[0]?.is_verified_purchase).toBe(true)
    expect(result[0]?.review_responses).toHaveLength(1)
  })

  it('fetches aggregated review stats through the RPC helper', async () => {
    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn(() =>
        createQueryBuilder({
        data: {
          average_rating: 4.5,
          total_reviews: 12,
        },
        error: null,
        }),
      ),
    } as never)

    const reviews = useReviews()
    const stats = await reviews.fetchReviewStats('product-1')

    expect(stats?.average_rating).toBe(4.5)
  })

  it('maps createReview HTTP errors to friendly messages', async () => {
    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({ from: vi.fn(), rpc: vi.fn() } as never)
    fetchMock.mockRejectedValueOnce({ statusCode: 429 })

    const reviews = useReviews()
    const result = await reviews.createReview('product-1', 5, 'Amazing product', 'Loved it')

    expect(result).toBeNull()
    expect(reviews.error.value).toBe('Too many reviews. Please try again later.')
  })

  it('updates, deletes, and toggles helpful votes for the current user', async () => {
    const fromMock = vi
      .fn()
      .mockImplementationOnce(() =>
        createQueryBuilder({
          data: null,
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        createQueryBuilder({
          data: { id: 'vote-1' },
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        createQueryBuilder({
          data: null,
          error: null,
        }),
      )
      .mockImplementationOnce(() =>
        createQueryBuilder({
          data: {
            id: 'review-1',
            product_id: 'product-1',
          },
          error: null,
        }),
      )

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({
      from: fromMock,
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    } as never)
    fetchMock.mockResolvedValueOnce({
      id: 'review-1',
      rating: 4,
      comment: 'Updated comment',
    } as never)

    const reviews = useReviews()

    await expect(
      reviews.updateReview('review-1', {
        rating: 4,
        comment: 'Updated comment',
      }),
    ).resolves.toMatchObject({ id: 'review-1' })
    await expect(reviews.deleteReview('review-1')).resolves.toBe(true)
    await expect(reviews.toggleHelpfulVote('review-1')).resolves.toBe(false)
    await expect(reviews.getUserReview('product-1')).resolves.toMatchObject({
      id: 'review-1',
    })
    await expect(reviews.hasUserPurchased('product-1')).resolves.toBe(true)
  })

  it('returns auth-friendly fallbacks when review actions are attempted anonymously', async () => {
    useSupabaseUserMock.mockReturnValue(ref(null))
    useSupabaseClientMock.mockReturnValue({ from: vi.fn(), rpc: vi.fn() } as never)

    const reviews = useReviews()

    await expect(reviews.createReview('product-1', 5, 'Anonymous review')).resolves.toBeNull()
    await expect(reviews.updateReview('review-1', { rating: 4 })).resolves.toBeNull()
    await expect(reviews.deleteReview('review-1')).resolves.toBe(false)
    await expect(reviews.toggleHelpfulVote('review-1')).resolves.toBe(false)
    await expect(reviews.getUserReview('product-1')).resolves.toBeNull()
    await expect(reviews.hasUserPurchased('product-1')).resolves.toBe(false)
    expect(reviews.error.value).toBe('You must be logged in to vote')
  })

  it('supports lowest-sort review fetching and adding helpful votes', async () => {
    let helpfulVoteCalls = 0
    const fromMock = vi.fn((table: string) => {
      if (table === 'reviews') {
        return createQueryBuilder({
          data: [
            {
              id: 'review-2',
              user_id: 'user-2',
              product_id: 'product-1',
              rating: 2,
              comment: 'Not great.',
              title: null,
              review_responses: null,
            },
          ],
          error: null,
        })
      }

      if (table === 'review_helpful_votes') {
        helpfulVoteCalls += 1
        return createQueryBuilder({
          data: helpfulVoteCalls === 1 ? [] : null,
          error: null,
        })
      }

      return createQueryBuilder({ data: null, error: null })
    })

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({
      from: fromMock,
      rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    } as never)

    const reviews = useReviews()
    const result = await reviews.fetchProductReviews('product-1', 'lowest')
    const voted = await reviews.toggleHelpfulVote('review-2')

    expect(result[0]).toMatchObject({
      id: 'review-2',
      user_has_voted: false,
      is_verified_purchase: false,
    })
    expect(voted).toBe(true)
  })

  it('captures fetch and mutation failures with graceful fallbacks', async () => {
    const fromMock = vi
      .fn()
      .mockImplementationOnce(() =>
        createQueryBuilder({
          data: null,
          error: { message: 'review query failed' },
        }),
      )
      .mockImplementationOnce(() =>
        createQueryBuilder({
          data: null,
          error: { message: 'delete failed' },
        }),
      )
      .mockImplementationOnce(() => {
        const builder = createQueryBuilder({ data: null, error: null })
        builder.maybeSingle.mockImplementationOnce(() => {
          throw new Error('vote lookup failed')
        })
        return builder
      })
      .mockImplementationOnce(() => {
        const builder = createQueryBuilder({ data: null, error: null })
        builder.maybeSingle.mockImplementationOnce(() => {
          throw new Error('review lookup failed')
        })
        return builder
      })

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({
      from: fromMock,
      rpc: vi.fn().mockRejectedValue(new Error('purchase lookup failed')),
    } as never)
    fetchMock
      .mockRejectedValueOnce({ statusCode: 409 })
      .mockRejectedValueOnce({ data: { message: 'Update failed' } })

    const reviews = useReviews()

    await expect(reviews.fetchProductReviews('product-1')).resolves.toEqual([])
    await expect(reviews.createReview('product-1', 5, 'Already reviewed')).resolves.toBeNull()
    expect(reviews.error.value).toBe('You have already reviewed this product')

    await expect(reviews.updateReview('review-1', { comment: 'Retry' })).resolves.toBeNull()
    expect(reviews.error.value).toBe('Update failed')

    await expect(reviews.deleteReview('review-1')).resolves.toBe(false)
    await expect(reviews.toggleHelpfulVote('review-1')).resolves.toBe(false)
    await expect(reviews.getUserReview('product-1')).resolves.toBeNull()
    await expect(reviews.hasUserPurchased('product-1')).resolves.toBe(false)
  })
})
