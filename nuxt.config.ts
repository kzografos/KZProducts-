import { defineNuxtConfig } from 'nuxt/config'


export default defineNuxtConfig({
  devtools: { enabled: true },
  alias: {
    '@/': './',
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxt/content'
  ],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY,
    redirect: false,
  },
  css: ['./assets/css/main.css'],
  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY,
    }
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      ignore: ['**/*.ts'],
    },
  ],
})