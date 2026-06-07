import { afterEach, beforeEach, vi } from 'vitest'
import * as nuxtMocks from './mocks/nuxt'
import { __resetNuxtMocks } from './mocks/nuxt'

Object.assign(globalThis, nuxtMocks)

beforeEach(() => {
  __resetNuxtMocks()
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})
