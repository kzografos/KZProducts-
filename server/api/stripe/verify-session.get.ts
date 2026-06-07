import { useStripeClient } from '~/server/utils/stripeInstance'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionId = query.session_id as string

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }

  const stripe = useStripeClient()

  try {
    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found'
      })
    }

    // Verify payment status
    if (session.payment_status !== 'paid') {
      return {
        success: false,
        status: session.payment_status,
        message: 'Payment not completed'
      }
    }

    // Get order details from metadata
    const orderId = session.metadata?.order_id
    const orderNumber = session.metadata?.order_number

    if (!orderId) {
      return {
        success: true,
        status: 'paid',
        orderNumber: null,
        message: 'Payment successful but order not found'
      }
    }

    // Use service role client to bypass RLS - Stripe already confirmed payment
    const client = await serverSupabaseServiceRole<Database>(event)
    const stripePaymentIntent = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || session.id

    // Mark paid here as a fallback for local/test flows where the webhook is delayed or not running.
    const { data: order, error: updateError } = await client
      .from('orders')
      .update({
        status: 'paid',
        stripe_payment_intent: stripePaymentIntent
      })
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Failed to update paid order from session verification:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update paid order'
      })
    }

    return {
      success: true,
      status: 'paid',
      orderNumber: order?.order_number || orderNumber,
      total: order?.total,
      orderId: order?.id
    }

  } catch (error: any) {
    console.error('Session verification error:', error.message)
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify session'
    })
  }
})
