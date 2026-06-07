import type { Database } from '~/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export const useAuth = () => {
  const user = useSupabaseUser()
  const client = useSupabaseClient<Database>()
  
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  
  // Get user's display name
  const displayName = computed(() => {
    if (profile.value?.full_name) return profile.value.full_name
    if (user.value?.user_metadata?.full_name) return user.value.user_metadata.full_name as string
    return user.value?.email || 'User'
  })
  
  // Get user's initials
  const initials = computed(() => {
    const name = displayName.value
    if (!name) return 'U'
    
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  })
  
  // Fetch user profile from DB
  const fetchProfile = async () => {
    if (!user.value) {
      profile.value = null
      return
    }
    
    loading.value = true
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }
      
      profile.value = (data as Profile | null) ?? null
    } finally {
      loading.value = false
    }
  }
  
  // Update user profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user.value) return { error: new Error('Not authenticated') }
    
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', user.value.id)
      .select()
      .single()
    
    const nextProfile = (data as Profile | null) ?? null

    if (!error && nextProfile) {
      profile.value = nextProfile
    }
    
    return { data: nextProfile, error }
  }
  
  // Watch for auth state changes
  watch(user, (newUser) => {
    if (newUser) {
      fetchProfile()
    } else {
      profile.value = null
    }
  }, { immediate: true })
  
  return {
    user,
    profile,
    displayName,
    initials,
    loading,
    fetchProfile,
    updateProfile
  }
}
