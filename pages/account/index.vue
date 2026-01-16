<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const user = useSupabaseUser()
const route = useRoute()

// Check if current route matches
const isActive = (path: string) => route.path === path
</script>

<template>
  <div class="container py-8">
    <div class="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between mb-8">
       <div>
           <h1 class="text-3xl font-bold">My Account</h1>
           <p class="text-muted-foreground">Welcome back, {{ user?.user_metadata?.full_name || user?.email }}</p>
       </div>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
       <!-- Sidebar Nav -->
       <div class="space-y-2">
          <Button :variant="isActive('/account') ? 'secondary' : 'ghost'" class="w-full justify-start" as-child>
             <NuxtLink to="/account">Dashboard</NuxtLink>
          </Button>
          <Button :variant="isActive('/account/orders') ? 'secondary' : 'ghost'" class="w-full justify-start" as-child>
             <NuxtLink to="/account/orders">Orders</NuxtLink>
          </Button>
          <Button :variant="isActive('/account/settings') ? 'secondary' : 'ghost'" class="w-full justify-start" as-child>
             <NuxtLink to="/account/settings">Settings</NuxtLink>
          </Button>
       </div>

       <div class="md:col-span-2 space-y-6">
          <div class="bg-card border rounded-lg p-6">
             <h2 class="text-lg font-semibold mb-4">Recent Orders</h2>
             <p class="text-sm text-muted-foreground">No orders found.</p>
             <!-- List orders here -->
          </div>

          <div class="bg-card border rounded-lg p-6">
             <h2 class="text-lg font-semibold mb-4">Account Details</h2>
             <div class="grid gap-2 text-sm">
                <div>
                   <span class="font-medium">Email:</span> {{ user?.email }}
                </div>
                <!-- More details -->
             </div>
          </div>
       </div>
    </div>
  </div>
</template>
