import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'
import type { Database } from '~/types/database.types'

/**
 * Verify that the current request is from an authenticated admin user.
 * Throws a 401 or 403 error if not authorized.
 * 
 * Usage in API routes:
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   await requireAdmin(event)
 *   // ... rest of handler
 * })
 * ```
 */
export async function requireAdmin(event: H3Event): Promise<void> {
  // Get authenticated user
  const user = await serverSupabaseUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Please log in'
    })
  }

  // Get Supabase client and check admin status
  const client = await serverSupabaseClient<Database>(event)
  
  const { data: profile, error } = await client
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error checking admin status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error verifying permissions'
    })
  }

  if (!profile?.is_admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admin access required'
    })
  }
}
