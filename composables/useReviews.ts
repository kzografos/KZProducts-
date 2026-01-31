import type { Database } from '~/types/database.types'

type Review = Database['public']['Tables']['reviews']['Row']
type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export interface ReviewWithDetails extends Review {
  profiles?: {
    full_name: string | null
    avatar_id: string | null
  } | null
  review_responses?: {
    id: string
    response: string
    created_at: string | null
    profiles?: {
      full_name: string | null
    } | null
  }[] | null
  helpful_count?: number
  is_verified_purchase?: boolean
  user_has_voted?: boolean
}

export interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_5: number
  rating_4: number
  rating_3: number
  rating_2: number
  rating_1: number
}

export type ReviewSortOption = 'recent' | 'highest' | 'lowest' | 'helpful'

export const useReviews = () => {
  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch reviews for a product with optional sorting
   */
  const fetchProductReviews = async (
    productId: string,
    sort: ReviewSortOption = 'recent',
    limit = 10,
    offset = 0
  ): Promise<ReviewWithDetails[]> => {
    loading.value = true
    error.value = null

    try {
      let query = client
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_id
          ),
          review_responses (
            id,
            response,
            created_at,
            profiles:admin_id (
              full_name
            )
          )
        `)
        .eq('product_id', productId)
        .eq('is_approved', true)

      // Apply sorting
      switch (sort) {
        case 'highest':
          query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })
          break
        case 'lowest':
          query = query.order('rating', { ascending: true }).order('created_at', { ascending: false })
          break
        case 'helpful':
          // Will sort by helpful count after fetching
          query = query.order('created_at', { ascending: false })
          break
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false })
      }

      query = query.range(offset, offset + limit - 1)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Fetch helpful vote counts for these reviews
      const reviewIds = data?.map(r => r.id) || []
      
      let helpfulCounts: Record<string, number> = {}
      let userVotes: Set<string> = new Set()

      if (reviewIds.length > 0) {
        // Get counts
        const { data: voteCounts } = await client
          .from('review_helpful_votes')
          .select('review_id')
          .in('review_id', reviewIds)

        if (voteCounts) {
          helpfulCounts = voteCounts.reduce((acc, vote) => {
            acc[vote.review_id] = (acc[vote.review_id] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        }

        // Check if current user has voted
        if (user.value) {
          const { data: userVoteData } = await client
            .from('review_helpful_votes')
            .select('review_id')
            .eq('user_id', user.value.id)
            .in('review_id', reviewIds)

          if (userVoteData) {
            userVotes = new Set(userVoteData.map(v => v.review_id))
          }
        }
      }

      // Check verified purchases
      const verifiedPurchases: Set<string> = new Set()
      if (data && data.length > 0) {
        for (const review of data) {
          const { data: hasPurchased } = await client
            .rpc('has_purchased_product', {
              p_user_id: review.user_id,
              p_product_id: productId
            })
          
          if (hasPurchased) {
            verifiedPurchases.add(review.id)
          }
        }
      }

      // Enrich reviews with counts and flags
      // Note: Supabase returns review_responses as a single object (due to unique constraint)
      // but our type and components expect an array, so we normalize it here
      const enrichedReviews: ReviewWithDetails[] = (data || []).map(review => {
        const { review_responses, ...restReview } = review
        return {
          ...restReview,
          review_responses: review_responses ? [review_responses] : null,
          helpful_count: helpfulCounts[review.id] || 0,
          user_has_voted: userVotes.has(review.id),
          is_verified_purchase: verifiedPurchases.has(review.id)
        }
      })

      // Sort by helpful if requested
      if (sort === 'helpful') {
        enrichedReviews.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0))
      }

      return enrichedReviews
    } catch (e: any) {
      error.value = e.message
      console.error('Error fetching reviews:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch review statistics for a product
   */
  const fetchReviewStats = async (productId: string): Promise<ReviewStats | null> => {
    try {
      const { data, error: fetchError } = await client
        .rpc('get_product_review_stats', { p_product_id: productId })
        .single()

      if (fetchError) throw fetchError

      return data as ReviewStats
    } catch (e: any) {
      console.error('Error fetching review stats:', e)
      return null
    }
  }

  /**
   * Create a new review via secure server endpoint
   * Server handles: authentication, sanitization, validation, rate limiting
   */
  const createReview = async (
    productId: string,
    rating: number,
    comment: string,
    title?: string
  ): Promise<Review | null> => {
    if (!user.value) {
      error.value = 'You must be logged in to write a review'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<Review>('/api/reviews/create', {
        method: 'POST',
        body: {
          product_id: productId,
          rating,
          comment,
          title: title || null
        }
      })

      return data
    } catch (e: any) {
      // Handle specific error codes
      if (e.statusCode === 429) {
        error.value = 'Too many reviews. Please try again later.'
      } else if (e.statusCode === 409) {
        error.value = 'You have already reviewed this product'
      } else {
        error.value = e.data?.message || e.message || 'Error creating review'
      }
      console.error('Error creating review:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing review via secure server endpoint
   * Server handles: authentication, ownership check, sanitization, validation
   */
  const updateReview = async (
    reviewId: string,
    updates: { rating?: number; comment?: string; title?: string }
  ): Promise<Review | null> => {
    if (!user.value) {
      error.value = 'You must be logged in'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<Review>(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        body: updates
      })

      return data
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error updating review'
      console.error('Error updating review:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a review
   */
  const deleteReview = async (reviewId: string): Promise<boolean> => {
    if (!user.value) {
      error.value = 'You must be logged in'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await client
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.value.id)

      if (deleteError) throw deleteError

      return true
    } catch (e: any) {
      error.value = e.message
      console.error('Error deleting review:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle helpful vote on a review
   */
  const toggleHelpfulVote = async (reviewId: string): Promise<boolean> => {
    if (!user.value) {
      error.value = 'You must be logged in to vote'
      return false
    }

    try {
      // Check if already voted
      const { data: existingVote } = await client
        .from('review_helpful_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (existingVote) {
        // Remove vote
        await client
          .from('review_helpful_votes')
          .delete()
          .eq('id', existingVote.id)
        return false // Now not voted
      } else {
        // Add vote
        await client
          .from('review_helpful_votes')
          .insert({
            review_id: reviewId,
            user_id: user.value.id
          })
        return true // Now voted
      }
    } catch (e: any) {
      console.error('Error toggling helpful vote:', e)
      return false
    }
  }

  /**
   * Check if current user has reviewed a product
   */
  const getUserReview = async (productId: string): Promise<Review | null> => {
    if (!user.value) return null

    try {
      const { data } = await client
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.value.id)
        .maybeSingle()

      return data
    } catch (e: any) {
      console.error('Error checking user review:', e)
      return null
    }
  }

  /**
   * Check if current user has purchased a product
   */
  const hasUserPurchased = async (productId: string): Promise<boolean> => {
    if (!user.value) return false

    try {
      const { data } = await client
        .rpc('has_purchased_product', {
          p_user_id: user.value.id,
          p_product_id: productId
        })

      return !!data
    } catch (e: any) {
      console.error('Error checking purchase:', e)
      return false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchProductReviews,
    fetchReviewStats,
    createReview,
    updateReview,
    deleteReview,
    toggleHelpfulVote,
    getUserReview,
    hasUserPurchased
  }
}
