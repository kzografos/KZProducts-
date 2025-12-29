import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const user = useSupabaseUser()
  const client = useSupabaseClient<Database>()

  // CRITICAL: On server-side, we need to check if there's no user session
  // If no user on server OR client, redirect immediately
  if (!user.value) {
    // Use abortNavigation on server to prevent SSR of protected content
    if (import.meta.server) {
      return navigateTo('/auth/login', { redirectCode: 302 })
    }
    return navigateTo('/auth/login')
  }

  // Fetch user profile to check admin status
  const { data: profile, error } = await client
    .from('profiles')
    .select('is_admin')
    .eq('id', user.value.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching admin status:', error)
    if (import.meta.server) {
      return navigateTo('/', { redirectCode: 302 })
    }
    return navigateTo('/')
  }

  // Check if user is admin
  if (!profile?.is_admin) {
    if (import.meta.server) {
      return navigateTo('/', { redirectCode: 302 })
    }
    return navigateTo('/')
  }
})
