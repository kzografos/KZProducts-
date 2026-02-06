import { defineNuxtConfig } from 'nuxt/config'


export default defineNuxtConfig({
  devtools: { enabled: true },
  alias: {
    '@/': './',
  },
  modules: [
    '@nuxt/image',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxt/content',
    '@nuxtjs/google-fonts',
    '@nuxtjs/fontaine'
  ],
  
  // Image optimization
  image: {
    format: ['webp'],
    quality: 80,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    presets: {
      product: {
        modifiers: {
          format: 'webp',
          quality: 80,
          width: 800,
          height: 800,
          fit: 'cover',
        }
      },
      thumbnail: {
        modifiers: {
          format: 'webp',
          quality: 75,
          width: 300,
          height: 300,
          fit: 'cover',
        }
      },
      hero: {
        modifiers: {
          format: 'webp',
          quality: 85,
          width: 1920,
          height: 1080,
          fit: 'cover',
        }
      }
    }
  },

  // Font optimization
  googleFonts: {
    families: {
      Inter: [300, 400, 500, 600, 700],
    },
    display: 'swap',
    preload: true,
    prefetch: true,
    download: true,
    inject: true,
  },
  
  fontMetrics: {
    fonts: ['Inter'],
  },

  // Preconnect for external resources
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'description', content: 'KZProducts - Build your dream PC with the best CPUs, GPUs, and components for gaming and workstation builds.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://js.stripe.com' },
        { rel: 'dns-prefetch', href: 'https://js.stripe.com' },
      ],
    },
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    redirect: false,
  },
  css: ['./assets/css/main.css'],
  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    // Email services
    mailtrapHost: process.env.MAILTRAP_HOST,
    mailtrapPort: process.env.MAILTRAP_PORT,
    mailtrapUser: process.env.MAILTRAP_USER,
    mailtrapPass: process.env.MAILTRAP_PASS,
    resendApiKey: process.env.RESEND_API_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      ignore: ['**/*.ts'],
    },
    {
      path: '~/components/admin',
      prefix: 'Admin',
      ignore: ['**/*.ts'],
    },
  ],
  
  // Nitro compression and caching
  nitro: {
    compressPublicAssets: true,
    minify: true,
  },
  
  routeRules: {
    // Static pages - prerender with ISR (regenerate every hour)
    '/': { isr: 60 * 60, prerender: true },
    '/about': { isr: 60 * 60 * 24, prerender: true }, // 24 hour cache
    '/contact': { isr: 60 * 60 * 24, prerender: true },
    '/faq': { isr: 60 * 60 * 24, prerender: true },
    '/shipping': { isr: 60 * 60 * 24, prerender: true },
    '/returns': { isr: 60 * 60 * 24, prerender: true },
    '/policies/**': { isr: 60 * 60 * 24, prerender: true },
    
    // Product pages - SWR with aggressive caching
    '/products': { swr: 60 * 30, cache: { maxAge: 60 * 10, staleMaxAge: 60 * 30 } }, // 30 min stale-while-revalidate
    '/products/**': { swr: 60 * 10, cache: { maxAge: 60 * 5, staleMaxAge: 60 * 15 } }, // 10 min SWR
    '/categories': { swr: 60 * 60, cache: { maxAge: 60 * 30, staleMaxAge: 60 * 60 } },
    '/categories/**': { swr: 60 * 30 },
    
    // API routes - short cache with CORS
    '/api/**': { cors: true, cache: { maxAge: 60, staleMaxAge: 60 * 5 } },
    
    // Auth routes - no cache
    '/auth/**': { cache: false },
    '/account/**': { cache: false },
    '/checkout/**': { cache: false },
    '/admin/**': { cache: false },
  },
  
  // Vite optimization
  vite: {
    build: {
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'pinia'],
            'supabase': ['@supabase/supabase-js'],
          }
        }
      }
    },
  },
})