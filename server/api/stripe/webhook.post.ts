import { serverSupabaseServiceRole } from '#supabase/server'
import { useStripeClient } from '~/server/utils/stripeInstance'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  try {
    const stripe = useStripeClient()
    const config = useRuntimeConfig()
    
    // Get raw body for signature verification - must NOT pass encoding
    // Stripe requires the raw buffer/string exactly as received
    const body = await readRawBody(event, false)
    const signature = getHeader(event, 'stripe-signature')

    if (!body || !signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing body or signature'
      })
    }

    const webhookSecret = config.stripeWebhookSecret
    
    if (!webhookSecret) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Webhook secret not configured'
      })
    }

    let stripeEvent

    try {
      stripeEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret as string)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      throw createError({
        statusCode: 400,
        statusMessage: `Webhook Error: ${err.message}`
      })
    }

    // Use service role client for admin operations (bypasses RLS)
    const supabase = await serverSupabaseServiceRole<Database>(event)

    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as any
        const orderId = session.metadata?.order_id
        const orderNumber = session.metadata?.order_number
        const userId = session.metadata?.user_id

        if (!orderId) {
          return { received: true, error: 'No order_id in metadata' }
        }

        // Update order status to 'paid'
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            stripe_payment_intent: session.payment_intent || session.id
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Failed to update order status:', updateError)
          return { received: true, error: 'Failed to update order' }
        }

        // Clear user's cart
        if (userId) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId)
        }

        // === NEW ORDER NOTIFICATION ===
        // Get order details for notification
        const { data: order } = await supabase
          .from('orders')
          .select('order_number, total')
          .eq('id', orderId)
          .maybeSingle()

        // Get customer name if available
        let customerName = 'Guest'
        if (userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .maybeSingle()
          
          customerName = profile?.full_name || profile?.email || 'Customer'
        }

        // Get all admin IDs and create notifications
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_admin', true)

        if (admins && admins.length > 0 && order) {
          const notifications = admins.map(admin => ({
            admin_id: admin.id,
            type: 'new_order' as const,
            title: 'New Order Received',
            message: `New order #${order.order_number} from ${customerName} - €${order.total.toFixed(2)}`,
            link: `/admin/orders/${orderId}`,
            priority: 'critical' as const,
            related_id: orderId,
            metadata: {
              orderNumber: order.order_number,
              customerName,
              total: order.total,
              userId
            }
          }))

          await supabase.from('admin_notifications').insert(notifications)
          console.log(`New order notification created for order #${order.order_number}`)
        }

        break
      }

      case 'checkout.session.expired': {
        const session = stripeEvent.data.object as any
        const orderId = session.metadata?.order_id

        if (orderId) {
          await supabase
            .from('orders')
            .update({ status: 'expired' })
            .eq('id', orderId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        // === PAYMENT FAILURE NOTIFICATION ===
        const paymentIntent = stripeEvent.data.object as any
        const orderId = paymentIntent.metadata?.order_id
        const orderNumber = paymentIntent.metadata?.order_number
        
        // Get failure reason
        const failureReason = paymentIntent.last_payment_error?.message || 'Unknown error'

        // Get order details if we have an order ID
        let orderTotal = paymentIntent.amount ? paymentIntent.amount / 100 : 0

        if (orderId) {
          const { data: order } = await supabase
            .from('orders')
            .select('order_number, total')
            .eq('id', orderId)
            .maybeSingle()
          
          if (order) {
            orderTotal = order.total
          }
        }

        // Get all admin IDs and create notifications
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_admin', true)

        if (admins && admins.length > 0) {
          const notifications = admins.map(admin => ({
            admin_id: admin.id,
            type: 'payment_failure' as const,
            title: 'Payment Failed',
            message: orderNumber 
              ? `Payment failed for order #${orderNumber} - €${orderTotal.toFixed(2)}`
              : `Payment failed - €${orderTotal.toFixed(2)}`,
            link: orderId ? `/admin/orders/${orderId}` : '/admin/orders',
            priority: 'critical' as const,
            related_id: orderId || null,
            metadata: {
              orderNumber,
              amount: orderTotal,
              failureReason,
              paymentIntentId: paymentIntent.id
            }
          }))

          await supabase.from('admin_notifications').insert(notifications)
          console.log(`Payment failure notification created for amount €${orderTotal}`)
        }

        break
      }

      default:
        // Unhandled event type - no action needed
        break
    }

    return { received: true }
    
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    
    // Re-throw createError exceptions
    if (error.statusCode) {
      throw error
    }
    
    // Handle unexpected errors
    throw createError({
      statusCode: 500,
      statusMessage: `Webhook processing failed: ${error.message}`
    })
  }
})
