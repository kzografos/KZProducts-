import { useSupabaseClient } from '#imports'
import { createQueryBuilder } from '../../fixtures/supabase'
import { useProducts } from '~/composables/useProducts'

describe('composables/useProducts', () => {
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)

  it('fetches active products for a category slug', async () => {
    const categoriesBuilder = createQueryBuilder({
      data: { id: 'cat-1' },
      error: null,
    })
    const productsBuilder = createQueryBuilder({
      data: [
        {
          id: 'product-1',
          name: 'RTX 5080',
          slug: 'rtx-5080',
          price: 1299,
          is_active: true,
          categories: { name: 'GPU', slug: 'gpu' },
        },
      ],
      error: null,
    })

    useSupabaseClientMock.mockReturnValue({
      from: vi.fn((table: string) => (table === 'categories' ? categoriesBuilder : productsBuilder)),
    } as never)

    const products = useProducts()
    await products.fetchProducts('gpu')

    expect(products.products.value).toHaveLength(1)
    expect(products.products.value[0]?.categories?.slug).toBe('gpu')
    expect(products.error.value).toBeNull()
  })

  it('returns null when a product does not exist', async () => {
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: null,
          error: null,
        }),
      ),
    } as never)

    const products = useProducts()

    await expect(products.fetchProduct('missing-product')).resolves.toBeNull()
  })

  it('stores an error message when product fetching fails', async () => {
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: null,
          error: { message: 'Database down' },
        }),
      ),
    } as never)

    const products = useProducts()
    await products.fetchProducts()

    expect(products.products.value).toEqual([])
    expect(products.error.value).toBe('Database down')
  })
})
