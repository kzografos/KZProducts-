import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { sanitizeText, validateReviewInput, detectSuspiciousContent } from '~/server/utils/sanitize'

export default defineEventHandler(async (event) => {
  // 1. AUTHENTICATION - Must be logged in
  const user = await serverSupabaseUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to write a review'
    })
  }
  
  // 2. READ BODY
  const body = await readBody(event)
  
  // Log suspicious content for monitoring (before sanitization)
  if (detectSuspiciousContent(body.comment) || detectSuspiciousContent(body.title)) {
    console.warn(`[Security] Suspicious content detected from user ${user.id}:`, {
      comment: body.comment?.substring(0, 100),
      title: body.title?.substring(0, 50)
    })
  }
  
  // 3. SANITIZE - Strip HTML, escape special chars
  const cleanTitle = body.title ? sanitizeText(body.title) : null
  const cleanComment = sanitizeText(body.comment || '')
  const productId = body.product_id
  const rating = parseInt(body.rating, 10)
  
  // 4. VALIDATE - Check all inputs server-side
  const errors = validateReviewInput({
    rating,
    comment: cleanComment,
    title: cleanTitle || undefined,
    productId
  })
  
  if (errors.length > 0) {
    throw createError({
      statusCode: 400,
      message: errors.join(', ')
    })
  }
  
  // 5. GET SUPABASE CLIENT
  const supabase = await serverSupabaseClient(event)
  
  // 6. RATE LIMITING - Max 5 reviews per hour per user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { count: reviewCount, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo)
  
  if (countError) {
    console.error('[Rate Limit] Error checking rate limit:', countError)
  }
  
  if (reviewCount !== null && reviewCount >= 5) {
    throw createError({
      statusCode: 429,
      message: 'Too many reviews. You can submit up to 5 reviews per hour. Please try again later.'
    })
  }
  
  // 7. CHECK EXISTING REVIEW - One review per product per user
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()
  
  if (existingReview) {
    throw createError({
      statusCode: 409,
      message: 'You have already reviewed this product. You can edit your existing review instead.'
    })
  }
  
  // 8. CHECK PRODUCT EXISTS
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle()
  
  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found'
    })
  }
  
  // 9. INSERT REVIEW
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      product_id: productId,
      rating,
      title: cleanTitle,
      comment: cleanComment
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Reviews] Error creating review:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create review. Please try again.'
    })
  }
  
  return data
})
