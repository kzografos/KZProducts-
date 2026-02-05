/**
 * Sanitize text input to prevent XSS attacks
 * - Strips ALL HTML tags using regex (serverless-compatible)
 * - Escapes special characters
 * - Trims whitespace
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  // Strip all HTML tags
  let clean = text.replace(/<[^>]*>/g, '')
  
  // Decode HTML entities first to catch encoded attacks
  clean = clean
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
  
  // Strip tags again after decoding
  clean = clean.replace(/<[^>]*>/g, '')
  
  // Escape special characters for safe storage/display
  return clean
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&(?!(lt|gt|quot|#x27);)/g, '&amp;')
    .trim()
}

/**
 * Validate review input data
 * Returns array of error messages (empty if valid)
 */
export function validateReviewInput(data: {
  rating?: number
  comment?: string
  title?: string
  productId?: string
}): string[] {
  const errors: string[] = []
  
  // Rating validation
  if (data.rating === undefined || data.rating === null) {
    errors.push('Rating is required')
  } else if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    errors.push('Rating must be an integer between 1 and 5')
  }
  
  // Comment validation
  if (!data.comment) {
    errors.push('Comment is required')
  } else {
    if (data.comment.length < 10) {
      errors.push('Comment must be at least 10 characters')
    }
    if (data.comment.length > 500) {
      errors.push('Comment must be less than 500 characters')
    }
  }
  
  // Title validation (optional but if provided must be valid)
  if (data.title && data.title.length > 100) {
    errors.push('Title must be less than 100 characters')
  }
  
  // Product ID validation
  if (!data.productId) {
    errors.push('Product ID is required')
  }
  
  return errors
}

/**
 * Check if text contains suspicious patterns that might indicate an attack
 * This is for logging/monitoring purposes
 */
export function detectSuspiciousContent(text: string): boolean {
  if (!text) return false
  
  const suspiciousPatterns = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /data:text\/html/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /onfocus\s*=/i,
    /onblur\s*=/i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(text))
}
