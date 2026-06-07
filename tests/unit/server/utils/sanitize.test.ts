import { detectSuspiciousContent, sanitizeText, validateReviewInput } from '~/server/utils/sanitize'

describe('server/utils/sanitize', () => {
  it('removes HTML tags and escapes unsafe characters', () => {
    expect(sanitizeText('  <script>alert("xss")</script><b>Hi & bye</b>  ')).toBe(
      'Hi &amp; bye',
    )
  })

  it('returns validation errors for incomplete review input', () => {
    expect(
      validateReviewInput({
        rating: 7,
        comment: 'short',
      }),
    ).toEqual([
      'Rating must be an integer between 1 and 5',
      'Comment must be at least 10 characters',
      'Product ID is required',
    ])
  })

  it('accepts valid review input', () => {
    expect(
      validateReviewInput({
        rating: 5,
        comment: 'This setup performs really well.',
        title: 'Excellent build',
        productId: 'product-1',
      }),
    ).toEqual([])
  })

  it('flags suspicious payloads for monitoring', () => {
    expect(detectSuspiciousContent('<img src=x onerror=alert(1)>')).toBe(true)
    expect(detectSuspiciousContent('Legitimate review body')).toBe(false)
  })
})
