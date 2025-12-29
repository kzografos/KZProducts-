<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'auth'
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

watch(user, () => {
  if (user.value) {
    router.push('/')
  }
})

const handleLogin = async () => {
    loading.value = true
    error.value = null
    try {
        const { error: err } = await client.auth.signInWithPassword({
            email: email.value,
            password: password.value
        })
        if (err) throw err
        router.push('/')
    } catch (e: any) {
        error.value = e.message
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="grid gap-6">
    <div class="grid gap-2 text-center">
      <h1 class="text-2xl font-bold">Welcome back</h1>
      <p class="text-muted-foreground text-sm">
        Enter your credentials to access your account
      </p>
    </div>
    <form @submit.prevent="handleLogin">
      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            auto-capitalize="none"
            auto-complete="email"
            auto-correct="off"
            v-model="email"
            required
          />
        </div>
        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <Label for="password">Password</Label>
            <NuxtLink 
              to="/auth/forgot-password" 
              class="text-xs text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </NuxtLink>
          </div>
          <Input
            id="password"
            type="password"
            auto-complete="current-password"
            v-model="password"
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
          Sign In
        </button>
      </div>
    </form>
    
    <div class="text-center text-sm">
      Don't have an account? 
      <NuxtLink to="/auth/register" class="underline hover:text-primary">
        Sign up
      </NuxtLink>
    </div>
  </div>
</template>
