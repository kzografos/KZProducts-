<script setup lang="ts">
import { Button } from '@/components/ui/button'
import CategoryShowcase from '@/components/home/CategoryShowcase.vue'

// Fetch frontmatter from content
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <!-- Decorative background elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
        <div class="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-primary/5 to-transparent blur-3xl" />
      </div>
      
      <div class="container relative py-24 lg:py-32">
        <div class="text-center space-y-8 max-w-4xl mx-auto">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
            {{ page?.hero?.title || 'Build Your Dream PC' }}
          </h1>
          <p class="mx-auto max-w-[700px] text-lg sm:text-xl text-muted-foreground">
            {{ page?.hero?.subtitle || 'The best CPUs, GPUs, and components for gaming and workstation builds.' }}
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" class="text-base px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow" as-child>
              <NuxtLink :to="page?.hero?.cta_primary_link || '/products'">
                {{ page?.hero?.cta_primary || 'Shop Now' }}
              </NuxtLink>
            </Button>
            <Button variant="outline" size="lg" class="text-base px-8" as-child>
              <NuxtLink :to="page?.hero?.cta_secondary_link || '/about'">
                {{ page?.hero?.cta_secondary || 'Learn More' }}
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Showcase -->
    <div class="container">
      <CategoryShowcase />
    </div>

    <!-- Features Section from Content -->
    <section class="container py-16">
      <article class="prose prose-lg dark:prose-invert mx-auto max-w-4xl">
        <ContentDoc />
      </article>
    </section>
  </div>
</template>
