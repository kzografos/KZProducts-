import type { Database } from '~/types/database.types'

export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const user = useSupabaseUser()
  const client = useSupabaseClient<Database>()

  // If no user, redirect to login
  if (!user.value) {
    return navigateTo('/auth/login', import.meta.server ? { redirectCode: 302 } : undefined)
  }

  try {
    // Fetch user profile to check admin status
    const { data: profile, error } = await client
      .from('profiles')
      .select('is_admin')
      .eq('id', user.value.id)
      .maybeSingle()

    // Redirect home on error or non-admin
    if (error || !profile?.is_admin) {
      return navigateTo('/', import.meta.server ? { redirectCode: 302 } : undefined)
    }

    // User is admin, allow access
  } catch {
    return navigateTo('/', import.meta.server ? { redirectCode: 302 } : undefined)
  }
})

