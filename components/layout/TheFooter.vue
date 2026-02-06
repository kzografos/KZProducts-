<script setup lang="ts">
import {
  Sparkles,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
} from "lucide-vue-next";
</script>

<template>
  <footer
    class="relative border-t border-white/10 bg-slate-950/80 backdrop-blur-xl"
  >
    <!-- Gradient line at top -->
    <div
      class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
    />

    <div class="container py-12 md:py-16">
      <div class="grid grid-cols-2 gap-8 md:grid-cols-5">
        <!-- Brand Column -->
        <div class="col-span-2 md:col-span-1">
          <NuxtLink to="/" class="flex items-center gap-2 mb-4">
            <div class="p-1.5 rounded-lg bg-violet-500/20">
              <Sparkles class="h-5 w-5 text-violet-400" />
            </div>
            <span class="font-bold text-white">KZProducts</span>
          </NuxtLink>
          <p class="text-sm text-slate-400 max-w-xs">
            Premium PC components for gaming and workstation builds.
          </p>
        </div>

        <!-- About Links -->
        <div>
          <h3 class="text-sm font-semibold text-white mb-4">About</h3>
          <ul class="space-y-3 text-sm">
            <li>
              <NuxtLink
                to="/about"
                class="text-slate-400 hover:text-violet-400 transition-colors"
                >Our Story</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/contact"
                class="text-slate-400 hover:text-violet-400 transition-colors"
                >Contact Us</NuxtLink
              >
            </li>
          </ul>
        </div>

        <!-- Support Links -->
        <div>
          <h3 class="text-sm font-semibold text-white mb-4">Support</h3>
          <ul class="space-y-3 text-sm">
            <li>
              <NuxtLink
                to="/faq"
                class="text-slate-400 hover:text-violet-400 transition-colors"
                >FAQ</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/shipping"
                class="text-slate-400 hover:text-violet-400 transition-colors"
                >Shipping</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/returns"
                class="text-slate-400 hover:text-violet-400 transition-colors"
                >Returns</NuxtLink
              >
            </li>
          </ul>
        </div>

        <!-- Legal Links -->
        <div>
          <h3 class="text-sm font-semibold text-white mb-4">Legal</h3>
          <ul class="space-y-3 text-sm">
            <li>
              <NuxtLink
                to="/policies/privacy"
                class="text-slate-400 hover:text-violet-400 transition-colors"
                >Privacy Policy</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/policies/terms"
                class="text-slate-400 hover:text-violet-400 transition-colors"
                >Terms of Service</NuxtLink
              >
            </li>
          </ul>
        </div>

        <!-- Social Links -->
        <div>
          <h3 class="text-sm font-semibold text-white mb-4">Connect</h3>
          <div class="flex gap-3">
            <!-- Social Media Links with Accessibility Labels -->
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on X (Twitter)" class="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all">
              <Twitter class="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Facebook" class="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all">
              <Facebook class="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" class="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all">
              <Instagram class="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Connect on LinkedIn" class="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all">
              <Linkedin class="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="mailto:support@kzproducts.com" aria-label="Email support at KZProducts" class="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all">
              <Mail class="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <!-- Newsletter Subscription -->
      <div class="mt-10 pt-8 border-t border-white/10">
        <div class="text-center max-w-md mx-auto">
          <h3 class="text-lg font-semibold text-white mb-2">
            Subscribe to Our Newsletter
          </h3>
          <p class="text-sm text-slate-400 mb-4">
            Get the latest deals, product updates, and exclusive offers.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-12 pt-8 border-t border-white/10">
        <div
          class="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p class="text-sm text-slate-400">
            © {{ new Date().getFullYear() }} KZProducts. All rights reserved.
          </p>
          <div class="flex items-center gap-4 text-sm text-slate-400">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
