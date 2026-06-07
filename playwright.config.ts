import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

loadEnv({ path: '.env.test', override: false })

const baseURL = process.env.NUXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000'
const nuxtBin = fileURLToPath(new URL('./node_modules/nuxt/bin/nuxt.mjs', import.meta.url))
const webServerCommand = `"${process.execPath}" "${nuxtBin}" dev --host 127.0.0.1 --port 3000`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
