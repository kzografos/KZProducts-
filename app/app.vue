<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Toast notifications - direct import from vue-sonner -->
    <Toaster 
      position="bottom-left" 
      theme="dark"
      :rich-colors="true"
      :close-button="true"
      :toast-options="{
        style: {
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white'
        }
      }"
    />
  </div>
</template>

<style>
/* Ensure toasts are always visible */
[data-sonner-toaster] {
  z-index: 99999 !important;
}
</style>
