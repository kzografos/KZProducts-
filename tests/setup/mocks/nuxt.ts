import { computed, nextTick, readonly, ref, watch } from 'vue'
import { vi } from 'vitest'

const stateStore = new Map<string, ReturnType<typeof ref>>()

export { computed, nextTick, readonly, ref, watch }

export const onMounted = (callback: () => void | Promise<void>) => {
  void callback()
}

export const onUnmounted = (_callback: () => void) => {}

export const useSupabaseClient = vi.fn()
export const useSupabaseUser = vi.fn(() => ref(null))
export const useRuntimeConfig = vi.fn(() => ({}))
export const useRoute = vi.fn(() => ({ params: {}, query: {} }))
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))
export const navigateTo = vi.fn((to: string) => to)
export const $fetch = vi.fn()
export const useFetch = vi.fn()

export const useState = vi.fn(<T>(key: string, init?: () => T) => {
  if (!stateStore.has(key)) {
    stateStore.set(key, ref(init ? init() : undefined))
  }

  return stateStore.get(key) as ReturnType<typeof ref<T>>
})

export const defineNuxtRouteMiddleware = <T extends (...args: any[]) => any>(handler: T) => handler
export const defineEventHandler = <T extends (...args: any[]) => any>(handler: T) => handler
export const definePageMeta = vi.fn()

export const createError = (input: {
  statusCode?: number
  statusMessage?: string
  message?: string
}) => {
  const error = new Error(input.statusMessage || input.message || 'Unexpected error')
  return Object.assign(error, input)
}

export const readBody = vi.fn()
export const readRawBody = vi.fn()
export const getHeader = vi.fn()
export const getQuery = vi.fn()
export const getRequestURL = vi.fn(() => new URL('http://127.0.0.1:3000'))
export const getRouterParam = vi.fn()

export const __resetNuxtMocks = () => {
  stateStore.clear()
  useSupabaseClient.mockReset()
  useSupabaseUser.mockReset()
  useRuntimeConfig.mockReset()
  useRoute.mockReset()
  useRouter.mockReset()
  navigateTo.mockReset()
  $fetch.mockReset()
  useFetch.mockReset()
  useState.mockClear()
  definePageMeta.mockClear()
  readBody.mockReset()
  readRawBody.mockReset()
  getHeader.mockReset()
  getQuery.mockReset()
  getRequestURL.mockReset()
  getRouterParam.mockReset()

  useSupabaseUser.mockReturnValue(ref(null))
  useRuntimeConfig.mockReturnValue({})
  useRoute.mockReturnValue({ params: {}, query: {} })
  useRouter.mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
  })
  navigateTo.mockImplementation((to: string) => to)
  getRequestURL.mockReturnValue(new URL('http://127.0.0.1:3000'))
}
