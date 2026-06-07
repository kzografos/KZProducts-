import { defineComponent } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'

export async function mountComposable<T>(factory: () => T | Promise<T>) {
  const wrapper = await mountSuspended(
    defineComponent({
      async setup() {
        return await factory()
      },
      template: '<div />',
    }),
  )

  return wrapper
}
