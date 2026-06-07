import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

interface ProductMetrics {
  averageRating: number
  reviewCount: number
  soldQuantity: number
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole<Database>(event)
  const metrics: Record<string, ProductMetrics> = {}

  const { data: reviews, error: reviewsError } = await client
    .from('reviews')
    .select('product_id, rating')
    .eq('is_approved', true)

  if (reviewsError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load product review metrics'
    })
  }

  const reviewBuckets = new Map<string, { ratingTotal: number; reviewCount: number }>()

  for (const review of reviews || []) {
    const bucket = reviewBuckets.get(review.product_id) || { ratingTotal: 0, reviewCount: 0 }
    bucket.ratingTotal += review.rating
    bucket.reviewCount += 1
    reviewBuckets.set(review.product_id, bucket)
  }

  for (const [productId, bucket] of reviewBuckets) {
    metrics[productId] = {
      averageRating: bucket.reviewCount > 0 ? bucket.ratingTotal / bucket.reviewCount : 0,
      reviewCount: bucket.reviewCount,
      soldQuantity: 0
    }
  }

  const { data: orders, error: ordersError } = await client
    .from('orders')
    .select('id')
    .in('status', ['paid', 'completed', 'shipped', 'delivered'])

  if (ordersError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load product popularity metrics'
    })
  }

  const orderIds = (orders || []).map(order => order.id)

  if (orderIds.length > 0) {
    const { data: orderItems, error: orderItemsError } = await client
      .from('order_items')
      .select('product_id, quantity')
      .in('order_id', orderIds)

    if (orderItemsError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to load product sales metrics'
      })
    }

    for (const item of orderItems || []) {
      if (!item.product_id) continue

      const metric = metrics[item.product_id] || {
        averageRating: 0,
        reviewCount: 0,
        soldQuantity: 0
      }

      metric.soldQuantity += item.quantity
      metrics[item.product_id] = metric
    }
  }

  return { metrics }
})
