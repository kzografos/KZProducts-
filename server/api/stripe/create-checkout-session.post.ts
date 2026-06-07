import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { useStripeClient } from '~/server/utils/stripeInstance'
import type { Database } from '~/types/database.types'

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

interface CartItem {
  productId: string
  quantity: number
}

interface ShippingAddress {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

interface CreateCheckoutBody {
  items: CartItem[]
  shipping: ShippingAddress
}

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Please log in to checkout'
    })
  }

  const body = await readBody<CreateCheckoutBody>(event)

  if (!body.items || body.items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cart is empty'
    })
  }

  if (!body.shipping?.fullName || !body.shipping?.address) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Shipping information is required'
    })
  }

  const client = await serverSupabaseClient<Database>(event)
  const stripe = useStripeClient()

  // SECURITY: Fetch product prices from database - never trust frontend
  const productIds = body.items.map(item => item.productId)
  const { data: products, error: productsError } = await client
    .from('products')
    .select('id, name, price, images')
    .in('id', productIds)

  if (productsError || !products) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch products'
    })
  }

  // Map products by ID for easy lookup
  const productMap = new Map(products.map(p => [p.id, p]))

  // Validate all products exist and build line items with DB prices
  const lineItems: any[] = []
  const orderItems: any[] = []
  let subtotal = 0

  for (const item of body.items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: `Product not found: ${item.productId}`
      })
    }

    const itemTotal = product.price * item.quantity
    subtotal += itemTotal

    // Stripe line item - price in cents
    lineItems.push({
      price_data: {
        currency: 'eur',
        product_data: {
          name: product.name,
          images: product.images?.slice(0, 1) || [],
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: item.quantity,
    })

    // Order item for database
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: product.price,
      total_price: itemTotal
    })
  }

  const shipping = 0 // Free shipping
  const tax = 0 // No tax for now
  const total = subtotal + shipping + tax
  const orderNumber = generateOrderNumber()

  try {
    // Create pending order BEFORE Stripe session
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal,
        shipping,
        tax,
        total,
        status: 'pending',
        notes: JSON.stringify(body.shipping)
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation failed:', orderError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create order'
      })
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }))

    const { error: itemsError } = await client
      .from('order_items')
      .insert(orderItemsWithOrderId)

    if (itemsError) {
      // Rollback order
      await client.from('orders').delete().eq('id', order.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create order items'
      })
    }

    const baseUrl = getRequestURL(event).origin
    const orderMetadata = {
      order_id: order.id,
      order_number: orderNumber,
      user_id: user.id
    }

    // Create Stripe Checkout Session with order metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: user.email,
      metadata: orderMetadata,
      payment_intent_data: {
        metadata: orderMetadata
      }
    })

    // Store Stripe session ID in order
    await client
      .from('orders')
      .update({ stripe_payment_intent: session.id })
      .eq('id', order.id)

    return { 
      url: session.url,
      orderId: order.id,
      orderNumber: orderNumber
    }

  } catch (error: any) {
    console.error('Checkout session error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create checkout session'
    })
  }
})
