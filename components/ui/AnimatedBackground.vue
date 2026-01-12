<script setup lang="ts">
// Animated background with grid and mesh gradients
// Uses very low z-index to stay behind all content
</script>

<template>
  <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <!-- Base dark gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
    
    <!-- Animated grid pattern -->
    <div class="absolute inset-0 opacity-20">
      <div class="grid-pattern" />
    </div>
    
    <!-- Mesh gradient orbs -->
    <div class="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-violet-600/20 via-violet-600/5 to-transparent blur-3xl animate-pulse-slow" />
    <div class="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600/15 via-fuchsia-600/5 to-transparent blur-3xl animate-float" />
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 blur-3xl animate-pulse-slow delay-1000" />
    
    <!-- Subtle scan line effect -->
    <div class="absolute inset-0 opacity-[0.015] pointer-events-none">
      <div class="scanlines" />
    </div>
  </div>
</template>

<style scoped>
.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}

.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-20px) translateX(10px);
  }
  50% {
    transform: translateY(-10px) translateX(-10px);
  }
  75% {
    transform: translateY(-25px) translateX(5px);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-float {
  animation: float 12s ease-in-out infinite;
}

.delay-1000 {
  animation-delay: 1s;
}
</style>
