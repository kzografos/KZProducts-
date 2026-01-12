<script setup lang="ts">
import { Button } from '@/components/ui/button'
import CategoryShowcase from '@/components/home/CategoryShowcase.vue'
import AnimatedBackground from '@/components/ui/AnimatedBackground.vue'

// Fetch frontmatter from content
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())
</script>

<template>
  <div class="relative min-h-screen bg-slate-950">
    <!-- Animated Background -->
    <AnimatedBackground />
    
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="container relative py-24 lg:py-32">
        <div class="text-center space-y-8 max-w-4xl mx-auto">
          <!-- Gradient Title -->
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-white via-white to-violet-400 bg-clip-text text-transparent">
            {{ page?.hero?.title || 'Build Your Dream PC' }}
          </h1>
          
          <!-- Subtitle -->
          <p class="mx-auto max-w-[700px] text-lg sm:text-xl text-slate-400">
            {{ page?.hero?.subtitle || 'The best CPUs, GPUs, and components for gaming and workstation builds.' }}
          </p>
          
          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <!-- Primary Button with Glow -->
            <NuxtLink 
              :to="page?.hero?.cta_primary_link || '/products'"
              class="group relative inline-flex items-center justify-center"
            >
              <span class="absolute inset-0 rounded-xl bg-violet-500/30 blur-xl transition-all duration-300 group-hover:bg-violet-500/50 group-hover:blur-2xl" />
              <span class="relative inline-flex items-center justify-center rounded-xl bg-violet-600 px-8 py-3 text-base font-semibold text-white transition-all duration-300 hover:bg-violet-500 hover:scale-105">
                {{ page?.hero?.cta_primary || 'Shop Now' }}
              </span>
            </NuxtLink>
            
            <!-- Secondary Button -->
            <NuxtLink 
              :to="page?.hero?.cta_secondary_link || '/about'"
              class="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-3 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/30"
            >
              {{ page?.hero?.cta_secondary || 'Learn More' }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Showcase -->
    <div class="container relative">
      <CategoryShowcase />
    </div>

    <!-- Features Section from Content -->
    <section class="container relative py-16">
      <article class="prose prose-lg prose-invert mx-auto max-w-4xl prose-headings:text-white prose-p:text-slate-400 prose-a:text-violet-400">
        <ContentDoc />
      </article>
    </section>
  </div>
</template>
