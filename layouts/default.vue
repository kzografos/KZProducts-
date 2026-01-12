<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div class="flex min-h-screen flex-col font-sans antialiased text-foreground bg-slate-950">
    <TheHeader />
    <main class="flex-1">
      <slot />
    </main>
    <TheFooter />
    <Toaster />
  </div>
</template>
