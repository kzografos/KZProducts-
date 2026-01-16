<script setup lang="ts">
// Toaster is provided globally in app.vue
</script>

<template>
  <div class="flex min-h-screen flex-col font-sans antialiased text-foreground bg-slate-950">
    <TheHeader />
    <main class="flex-1">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>
