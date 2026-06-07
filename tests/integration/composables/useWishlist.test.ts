vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { toast } from 'vue-sonner'
import { nextTick, ref, useRouter, useSupabaseClient, useSupabaseUser } from '#imports'
import { createQueryBuilder } from '../../fixtures/supabase'
import { useWishlist } from '~/composables/useWishlist'

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('composables/useWishlist', () => {
  const useSupabaseClientMock = vi.mocked(useSupabaseClient)
  const useSupabaseUserMock = vi.mocked(useSupabaseUser)
  const useRouterMock = vi.mocked(useRouter)

  it('loads wishlist items for the signed-in user', async () => {
    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({
      from: vi.fn(() =>
        createQueryBuilder({
          data: [{ product_id: 'product-1' }, { product_id: 'product-2' }],
          error: null,
        }),
      ),
    } as never)

    const wishlist = useWishlist()
    await flushPromises()

    expect(wishlist.wishlistItems.value).toEqual(['product-1', 'product-2'])
    expect(wishlist.initialized.value).toBe(true)
  })

  it('redirects anonymous users to login when adding to wishlist', async () => {
    const push = vi.fn()
    useSupabaseUserMock.mockReturnValue(ref(null))
    useSupabaseClientMock.mockReturnValue({ from: vi.fn() } as never)
    useRouterMock.mockReturnValue({ push } as never)

    const wishlist = useWishlist()

    await expect(wishlist.addToWishlist('product-1')).resolves.toBe(false)
    expect(push).toHaveBeenCalledWith('/auth/login')
    expect(toast.error).toHaveBeenCalled()
  })

  it('adds a product optimistically and keeps it on success', async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: null,
        }),
      )

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)
    useRouterMock.mockReturnValue({ push: vi.fn() } as never)

    const wishlist = useWishlist()
    await flushPromises()
    await wishlist.addToWishlist('product-3')

    expect(wishlist.wishlistItems.value).toContain('product-3')
    expect(toast.success).toHaveBeenCalled()
  })

  it('rolls back optimistic add when the product already exists', async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { code: '23505' },
        }),
      )

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)
    useRouterMock.mockReturnValue({ push: vi.fn() } as never)

    const wishlist = useWishlist()
    await flushPromises()
    await wishlist.addToWishlist('product-3')

    expect(wishlist.wishlistItems.value).not.toContain('product-3')
    expect(toast.info).toHaveBeenCalled()
  })

  it('removes wishlist items and toggles existing products off', async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [{ product_id: 'product-1' }, { product_id: 'product-2' }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: null,
        }),
      )

    useSupabaseUserMock.mockReturnValue(ref({ id: 'user-1' } as never))
    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)
    useRouterMock.mockReturnValue({ push: vi.fn() } as never)

    const wishlist = useWishlist()
    await flushPromises()

    expect(wishlist.isInWishlist('product-2')).toBe(true)
    await expect(wishlist.removeFromWishlist('product-1')).resolves.toBe(true)
    await expect(wishlist.toggleWishlist('product-2')).resolves.toBe(true)
    expect(wishlist.wishlistItems.value).toEqual([])
    expect(toast.success).toHaveBeenCalledWith('Removed from favorites')
  })

  it('restores items when removal fails and resets when the user logs out', async () => {
    const user = ref({ id: 'user-1' } as never)
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createQueryBuilder({
          data: [{ product_id: 'product-1' }],
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: null,
          error: { message: 'delete failed' },
        }),
      )

    useSupabaseUserMock.mockReturnValue(user)
    useSupabaseClientMock.mockReturnValue({ from: fromMock } as never)
    useRouterMock.mockReturnValue({ push: vi.fn() } as never)

    const wishlist = useWishlist()
    await flushPromises()

    await expect(wishlist.removeFromWishlist('product-1')).resolves.toBe(false)
    expect(wishlist.wishlistItems.value).toEqual(['product-1'])
    expect(toast.error).toHaveBeenCalledWith('Failed to remove from favorites')

    user.value = null as never
    await nextTick()
    await flushPromises()

    expect(wishlist.wishlistItems.value).toEqual([])
    expect(wishlist.initialized.value).toBe(false)
  })
})
