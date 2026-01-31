import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { sanitizeText, validateReviewInput, detectSuspiciousContent } from '~/server/utils/sanitize'

export default defineEventHandler(async (event) => {
  // 1. AUTHENTICATION - Must be logged in
  const user = await serverSupabaseUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to edit a review'
    })
  }
  
  // 2. GET REVIEW ID FROM URL
  const reviewId = getRouterParam(event, 'id')
  
  if (!reviewId) {
    throw createError({
      statusCode: 400,
      message: 'Review ID is required'
    })
  }
  
  // 3. GET SUPABASE CLIENT
  const supabase = await serverSupabaseClient(event)
  
  // 4. CHECK REVIEW EXISTS AND BELONGS TO USER
  const { data: existingReview, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .single()
  
  if (fetchError || !existingReview) {
    throw createError({
      statusCode: 404,
      message: 'Review not found'
    })
  }
  
  if (existingReview.user_id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You can only edit your own reviews'
    })
  }
  
  // 5. READ BODY
  const body = await readBody(event)
  
  // Log suspicious content for monitoring
  if (detectSuspiciousContent(body.comment) || detectSuspiciousContent(body.title)) {
    console.warn(`[Security] Suspicious content in edit from user ${user.id}:`, {
      reviewId,
      comment: body.comment?.substring(0, 100),
      title: body.title?.substring(0, 50)
    })
  }
  
  // 6. SANITIZE - Strip HTML, escape special chars
  const cleanTitle = body.title !== undefined 
    ? (body.title ? sanitizeText(body.title) : null) 
    : existingReview.title
  
  const cleanComment = body.comment !== undefined 
    ? sanitizeText(body.comment || '')
    : existingReview.comment
    
  const rating = body.rating !== undefined 
    ? parseInt(body.rating, 10)
    : existingReview.rating
  
  // 7. VALIDATE - Check all inputs server-side
  const errors = validateReviewInput({
    rating,
    comment: cleanComment,
    title: cleanTitle || undefined,
    productId: existingReview.product_id
  })
  
  if (errors.length > 0) {
    throw createError({
      statusCode: 400,
      message: errors.join(', ')
    })
  }
  
  // 8. UPDATE REVIEW
  const { data, error } = await supabase
    .from('reviews')
    .update({
      rating,
      title: cleanTitle,
      comment: cleanComment,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .eq('user_id', user.id) // Extra safety check
    .select()
    .single()
  
  if (error) {
    console.error('[Reviews] Error updating review:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update review. Please try again.'
    })
  }
  
  return data
})
