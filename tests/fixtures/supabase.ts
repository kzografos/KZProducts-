import { vi } from 'vitest'

type AsyncResult<T> = Promise<T>

export function createQueryBuilder<T>(result: T) {
  const builder: Record<string, any> = {}
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'gte',
    'lt',
    'in',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
  ] as const

  for (const method of methods) {
    builder[method] = vi.fn(() => builder)
  }

  builder.then = (onFulfilled?: (value: T) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected)
  builder.catch = (onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).catch(onRejected)
  builder.finally = (onFinally?: () => void) =>
    Promise.resolve(result).finally(onFinally)

  return builder as typeof builder & PromiseLike<T>
}

export function createSupabaseClientMock(options?: {
  from?: (table: string) => unknown
  rpc?: (fn: string, args?: Record<string, unknown>) => AsyncResult<unknown>
}) {
  return {
    from: vi.fn((table: string) => options?.from?.(table)),
    rpc: vi.fn((fn: string, args?: Record<string, unknown>) => options?.rpc?.(fn, args)),
    storage: {
      from: vi.fn(),
    },
    channel: vi.fn(),
    removeChannel: vi.fn(),
  }
}
