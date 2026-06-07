import { useRuntimeConfig } from '#imports'

const { stripeConstructorMock } = vi.hoisted(() => ({
  stripeConstructorMock: vi.fn(function StripeMock(this: Record<string, unknown>, secretKey: string, options: Record<string, unknown>) {
    this.secretKey = secretKey
    this.options = options
  }),
}))

vi.mock('stripe', () => ({
  default: stripeConstructorMock,
}))

describe('server/utils/stripeInstance', () => {
  const useRuntimeConfigMock = vi.mocked(useRuntimeConfig)

  beforeEach(() => {
    vi.resetModules()
    stripeConstructorMock.mockClear()
  })

  it('creates and reuses a Stripe client', async () => {
    useRuntimeConfigMock.mockReturnValue({ stripeSecretKey: 'sk_test_123' })

    const { useStripeClient } = await import('~/server/utils/stripeInstance')

    const firstClient = useStripeClient()
    const secondClient = useStripeClient()

    expect(firstClient).toBe(secondClient)
    expect(stripeConstructorMock).toHaveBeenCalledTimes(1)
    expect(stripeConstructorMock).toHaveBeenCalledWith('sk_test_123', {
      apiVersion: '2025-12-15.clover',
    })
  })

  it('throws when the secret key is missing', async () => {
    useRuntimeConfigMock.mockReturnValue({ stripeSecretKey: '' })
    const { useStripeClient } = await import('~/server/utils/stripeInstance')

    expect(() => useStripeClient()).toThrow('STRIPE_SECRET_KEY is not configured')
  })
})
