import { toast } from 'vue-sonner'

interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export function useWishlist() {
  const user = useSupabaseUser()
  const client = useSupabaseClient()
  const router = useRouter()
  
  // Reactive state
  const wishlistItems = useState<string[]>('wishlist-items', () => [])
  const loading = ref(false)
  const initialized = ref(false)

  /**
   * Check if a product is in the wishlist
   */
  const isInWishlist = (productId: string) => {
    return wishlistItems.value.includes(productId)
  }

  /**
   * Fetch user's wishlist from database
   */
  const fetchWishlist = async () => {
    if (!user.value?.id) {
      wishlistItems.value = []
      return
    }

    try {
      const { data, error } = await client
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', user.value.id)

      if (error) throw error

      wishlistItems.value = (data || []).map((item: { product_id: string }) => item.product_id)
      initialized.value = true
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
    }
  }

  /**
   * Add product to wishlist
   */
  const addToWishlist = async (productId: string) => {
    if (!user.value?.id) {
      toast.error('Please login to add items to your wishlist')
      router.push('/auth/login')
      return false
    }

    // Optimistic update
    wishlistItems.value = [...wishlistItems.value, productId]

    try {
      const { error } = await client
        .from('wishlist_items')
        .insert({ user_id: user.value.id, product_id: productId })

      if (error) throw error

      toast.success('Added to favorites!', {
        description: 'View your wishlist in your account.'
      })
      return true
    } catch (error: any) {
      // Rollback optimistic update
      wishlistItems.value = wishlistItems.value.filter(id => id !== productId)
      
      if (error.code === '23505') {
        // Already exists (unique constraint violation)
        toast.info('Already in your favorites')
      } else {
        console.error('Failed to add to wishlist:', error)
        toast.error('Failed to add to favorites')
      }
      return false
    }
  }

  /**
   * Remove product from wishlist
   */
  const removeFromWishlist = async (productId: string) => {
    if (!user.value?.id) return false

    // Optimistic update
    const previousItems = [...wishlistItems.value]
    wishlistItems.value = wishlistItems.value.filter(id => id !== productId)

    try {
      const { error } = await client
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.value.id)
        .eq('product_id', productId)

      if (error) throw error

      toast.success('Removed from favorites')
      return true
    } catch (error) {
      // Rollback optimistic update
      wishlistItems.value = previousItems
      console.error('Failed to remove from wishlist:', error)
      toast.error('Failed to remove from favorites')
      return false
    }
  }

  /**
   * Toggle wishlist status for a product
   */
  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      return removeFromWishlist(productId)
    } else {
      return addToWishlist(productId)
    }
  }

  // Initialize wishlist when user changes
  watch(user, (newUser) => {
    if (newUser?.id) {
      fetchWishlist()
    } else {
      wishlistItems.value = []
      initialized.value = false
    }
  }, { immediate: true })

  return {
    wishlistItems,
    loading,
    initialized,
    isInWishlist,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist
  }
}
