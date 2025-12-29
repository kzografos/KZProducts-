<script setup lang="ts">
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, Lock } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'auth'
})

const client = useSupabaseClient()
const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

// Check for error in URL (expired/invalid token)
const urlError = computed(() => {
  const hash = route.hash
  if (hash.includes('error=')) {
    const params = new URLSearchParams(hash.substring(1))
    return params.get('error_description')?.replace(/\+/g, ' ') || 'Invalid or expired link'
  }
  return null
})

const handleResetPassword = async () => {
  // Validate passwords match
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  // Validate password strength
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true
  error.value = null

  try {
    const { error: err } = await client.auth.updateUser({
      password: password.value
    })

    if (err) throw err

    success.value = true
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/auth/login')
    }, 3000)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Error State (expired/invalid link) -->
    <div v-if="urlError" class="text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <XCircle class="h-8 w-8 text-red-600" />
      </div>
      <h1 class="text-2xl font-bold">Link expired</h1>
      <p class="mt-2 text-muted-foreground text-sm">
        {{ urlError }}
      </p>
      <NuxtLink 
        to="/auth/forgot-password" 
        class="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Request new link
      </NuxtLink>
    </div>

    <!-- Success State -->
    <div v-else-if="success" class="text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle class="h-8 w-8 text-green-600" />
      </div>
      <h1 class="text-2xl font-bold">Password updated!</h1>
      <p class="mt-2 text-muted-foreground text-sm">
        Your password has been successfully reset.<br />
        Redirecting to login...
      </p>
    </div>

    <!-- Reset Form -->
    <template v-else>
      <div class="grid gap-2 text-center">
        <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock class="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 class="text-2xl font-bold">Set new password</h1>
        <p class="text-muted-foreground text-sm">
          Your new password must be at least 6 characters
        </p>
      </div>

      <form @submit.prevent="handleResetPassword">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="password">New Password</Label>
            <div class="relative">
              <Input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                auto-complete="new-password"
                v-model="password"
                required
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              auto-complete="new-password"
              v-model="confirmPassword"
              required
            />
          </div>

          <div v-if="error" class="text-sm text-destructive">
            {{ error }}
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            Reset password
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
