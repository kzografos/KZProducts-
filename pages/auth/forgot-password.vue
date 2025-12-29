<script setup lang="ts">
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'auth'
})

const client = useSupabaseClient()

const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const handleResetRequest = async () => {
  loading.value = true
  error.value = null
  
  try {
    const { error: err } = await client.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    if (err) throw err
    
    success.value = true
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <!-- Success State -->
    <div v-if="success" class="text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle class="h-8 w-8 text-green-600" />
      </div>
      <h1 class="text-2xl font-bold">Check your email</h1>
      <p class="mt-2 text-muted-foreground text-sm">
        We've sent a password reset link to<br />
        <span class="font-medium text-foreground">{{ email }}</span>
      </p>
      <p class="mt-4 text-muted-foreground text-xs">
        Didn't receive the email? Check your spam folder or
        <button 
          class="text-primary underline hover:text-primary/80"
          @click="success = false"
        >
          try again
        </button>
      </p>
      <NuxtLink 
        to="/auth/login" 
        class="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
      >
        <ArrowLeft class="h-4 w-4" />
        Back to login
      </NuxtLink>
    </div>

    <!-- Request Form -->
    <template v-else>
      <div class="grid gap-2 text-center">
        <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Mail class="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 class="text-2xl font-bold">Forgot password?</h1>
        <p class="text-muted-foreground text-sm">
          No worries, we'll send you reset instructions
        </p>
      </div>

      <form @submit.prevent="handleResetRequest">
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

      <div class="text-center">
        <NuxtLink 
          to="/auth/login" 
          class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to login
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
