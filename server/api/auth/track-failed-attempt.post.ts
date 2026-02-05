import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

interface TrackFailedAttemptBody {
  email: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TrackFailedAttemptBody>(event)
  
  if (!body?.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  // Get client IP address
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIp = getHeader(event, 'x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1'

  const client = serverSupabaseServiceRole<Database>(event)

  try {
    // Record the failed login attempt
    const { error: insertError } = await client
      .from('login_attempts')
      .insert({
        ip_address: ip,
        user_email: body.email,
        success: false
      })

    if (insertError) {
      console.error('Error recording login attempt:', insertError)
      // Don't fail the request, just log the error
    }

    // Count failed attempts from this IP in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { count, error: countError } = await client
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('success', false)
      .gte('attempted_at', tenMinutesAgo)

    if (countError) {
      console.error('Error counting login attempts:', countError)
      return { tracked: true }
    }

    const failedCount = count || 0

    // If 5+ failures, create security alert notification for all admins
    if (failedCount >= 5) {
      // Get all admin IDs
      const { data: admins, error: adminsError } = await client
        .from('profiles')
        .select('id')
        .eq('is_admin', true)

      if (adminsError) {
        console.error('Error fetching admins:', adminsError)
        return { tracked: true, alertTriggered: false }
      }

      if (admins && admins.length > 0) {
        // Create notifications for all admins
        const notifications = admins.map(admin => ({
          admin_id: admin.id,
          type: 'security_alert' as const,
          title: 'Security Alert',
          message: `Security Alert: ${failedCount} failed login attempts from IP ${ip}`,
          link: '/admin/settings',
          priority: 'critical' as const,
          metadata: {
            ip_address: ip,
            attempt_count: failedCount,
            last_email: body.email
          }
        }))

        const { error: notifyError } = await client
          .from('admin_notifications')
          .insert(notifications)

        if (notifyError) {
          console.error('Error creating security notifications:', notifyError)
        } else {
          console.log(`Security alert created for ${failedCount} failed attempts from IP ${ip}`)
        }

        return { tracked: true, alertTriggered: true }
      }
    }

    return { tracked: true, alertTriggered: false }
  } catch (error) {
    console.error('Error in track-failed-attempt:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to track login attempt'
    })
  }
})
