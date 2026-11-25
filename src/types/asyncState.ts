/**
 * Discriminated union for asynchronous UI/query state machines.
 * Eliminates ambiguous boolean flag combinations like `isLoading && !isError && isSyncing`.
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

export interface QueryLikeState<T> {
  isLoading: boolean
  isError: boolean
  error: unknown
  data: T | undefined
}

/** Converts a TanStack Query result into an exhaustive `AsyncState<T>` discriminated union. */
export function toAsyncState<T>(query: QueryLikeState<T>): AsyncState<T> {
  if (query.isLoading) {
    return { status: 'loading' }
  }
  if (query.isError) {
    const err =
      query.error instanceof Error
        ? query.error
        : new Error(typeof query.error === 'string' ? query.error : 'Unknown query error')
    return { status: 'error', error: err }
  }
  if (query.data !== undefined) {
    return { status: 'success', data: query.data }
  }
  return { status: 'idle' }
}
