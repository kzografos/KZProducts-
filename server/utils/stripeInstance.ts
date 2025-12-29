import Stripe from 'stripe'

let _stripeClient: Stripe | null = null

export function useStripeClient(): Stripe {
  if (!_stripeClient) {
    const config = useRuntimeConfig()
    const secretKey = config.stripeSecretKey
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Please add it to your .env file.')
    }
    
    _stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    })
  }
  return _stripeClient
}
