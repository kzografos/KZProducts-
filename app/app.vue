<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Toast notifications - bottom-left for better visibility in admin panel -->
    <Sonner 
      position="bottom-left" 
      :theme="'dark'"
      :rich-colors="true"
      :close-button="true"
    />
  </div>
</template>
