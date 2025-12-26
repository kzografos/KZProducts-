import { defineStore, skipHydrate } from 'pinia'
import type { Database } from '~/types/database.types'

type Product = Database['public']['Tables']['products']['Row'] & {
  categories?: { name: string; slug: string } | null
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

const CART_STORAGE_KEY = 'kz-cart'

export const useCartStore = defineStore('cart', () => {
  // State - skipHydrate prevents SSR/client mismatch
  const items = ref<CartItem[]>([])

  // Initialize from localStorage (client-side only)
  const isHydrated = ref(false)

  const initFromStorage = () => {
    if (import.meta.client && !isHydrated.value) {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY)
        if (saved) {
          items.value = JSON.parse(saved)
        }
      } catch (e) {
        console.warn('Failed to load cart from localStorage:', e)
      }
      isHydrated.value = true
    }
  }

  // Persist to localStorage whenever items change
  const saveToStorage = () => {
    if (import.meta.client) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value))
      } catch (e) {
        console.warn('Failed to save cart to localStorage:', e)
      }
    }
  }

  // Watch for changes and persist
  watch(items, saveToStorage, { deep: true })

  // Actions
  const addToCart = (product: Product, quantity = 1) => {
    initFromStorage() // Ensure hydrated
    
    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        productId: product.id,
        product,
        quantity
      })
    }
  }

  const removeFromCart = (productId: string) => {
    const idx = items.value.findIndex(i => i.productId === productId)
    if (idx > -1) {
      items.value.splice(idx, 1)
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const item = items.value.find(i => i.productId === productId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId)
      } else {
        item.quantity = quantity
      }
    }
  }

  const clearCart = () => {
    items.value = []
  }

  // Getters
  const count = computed(() => 
    items.value.reduce((acc, item) => acc + item.quantity, 0)
  )

  const total = computed(() => 
    items.value.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  )

  return {
    // State (skip hydrate to prevent SSR mismatch)
    items: skipHydrate(items),
    isHydrated: skipHydrate(isHydrated),
    // Actions
    initFromStorage,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    // Getters
    count,
    total
  }
})
