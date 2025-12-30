<script setup lang="ts">
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

const props = withDefaults(defineProps<ToasterProps>(), {
  theme: 'dark',
  position: 'bottom-left',
  richColors: true,
  closeButton: true
})
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :toastOptions="{
      classes: {
        toast: 'group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-slate-400',
        actionButton: 'group-[.toast]:bg-violet-500 group-[.toast]:text-white',
        cancelButton: 'group-[.toast]:bg-slate-700 group-[.toast]:text-slate-300',
        success: 'group-[.toaster]:!bg-emerald-900 group-[.toaster]:!border-emerald-500/30',
        error: 'group-[.toaster]:!bg-rose-900 group-[.toaster]:!border-rose-500/30',
      },
    }"
  />
</template>

<style>
/* Ensure toasts appear above everything */
[data-sonner-toaster] {
  z-index: 99999 !important;
}
</style>
