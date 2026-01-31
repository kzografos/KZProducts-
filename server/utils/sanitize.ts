import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize text input to prevent XSS attacks
 * - Strips ALL HTML tags using DOMPurify
 * - Escapes special characters
 * - Trims whitespace
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  // First pass: DOMPurify strips all HTML tags
  const clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
  
  // Second pass: Escape any remaining special characters
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
