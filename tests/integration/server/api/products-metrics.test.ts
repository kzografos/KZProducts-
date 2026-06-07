import { serverSupabaseServiceRole } from '#supabase/server'
import metricsHandler from '~/server/api/products/metrics.get'
import { createQueryBuilder } from '../../../fixtures/supabase'

describe('server/api/products/metrics.get', () => {
  const serverSupabaseServiceRoleMock = vi.mocked(serverSupabaseServiceRole)

  it('aggregates ratings and sold quantities per product', async () => {
    const reviewsQuery = createQueryBuilder({
      data: [
        { product_id: 'product-1', rating: 5 },
        { product_id: 'product-1', rating: 3 },
        { product_id: 'product-2', rating: 4 },
      ],
      error: null,
    })
    const ordersQuery = createQueryBuilder({
      data: [{ id: 'order-1' }, { id: 'order-2' }],
      error: null,
    })
    const orderItemsQuery = createQueryBuilder({
      data: [
        { product_id: 'product-1', quantity: 2 },
        { product_id: 'product-2', quantity: 1 },
        { product_id: null, quantity: 99 },
      ],
      error: null,
    })
    let ordersCallCount = 0

    serverSupabaseServiceRoleMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'reviews') {
          return reviewsQuery
        }

        if (table === 'orders') {
          ordersCallCount += 1
          return ordersQuery
        }

        if (table === 'order_items') {
          return orderItemsQuery
        }

        return createQueryBuilder({ data: null, error: null })
      }),
    } as never)

    const result = await metricsHandler({} as never)

    expect(ordersCallCount).toBe(1)
    expect(result).toEqual({
      metrics: {
        'product-1': {
          averageRating: 4,
          reviewCount: 2,
          soldQuantity: 2,
        },
        'product-2': {
          averageRating: 4,
          reviewCount: 1,
          soldQuantity: 1,
        },
      },
    })
  })

  it('returns a server error when review metrics cannot be loaded', async () => {
    serverSupabaseServiceRoleMock.mockResolvedValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: null,
          error: { message: 'review query failed' },
        }),
      ),
    } as never)

    await expect(metricsHandler({} as never)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to load product review metrics',
    })
  })
})
