import { useRef } from 'react'

/**
 * Memoizes a callback function so that it will not be recreated on every render.
 * The returned function is guaranteed to be the same reference across renders.
 * @param callback the callback function to memoize
 * @returns the memoized callback function
 */
export function useCallbackRef<T extends (...args: any[]) => any>(callback: T | null | undefined): T {
  const ref = useRef(callback)
  ref.current = callback

  const callbackRef = useRef<T>(null)
  if (callbackRef.current == null) {
    callbackRef.current = ((...args: any[]) => ref.current?.(...args)) as T
  }

  return callbackRef.current
}
