import { useMemo, useRef } from 'react'

/**
 * Memoizes a callback function so that it will not be recreated on every render.
 * The returned function is guaranteed to be the same reference across renders.
 * @param callback the callback function to memoize
 * @returns the memoized callback function
 */
export function useCallbackRef<T extends (...args: any[]) => any>(callback: T | null | undefined): T {
  const ref = useRef(callback)
  ref.current = callback

  return useMemo(() => {
    const wrapped = ((...args: any[]) => {
      return ref.current?.(...args)
    }) as T
    if (callback) {
      Object.defineProperties(wrapped, {
        length: { value: callback.length },
        name: { value: `${callback.name || 'anonymous'}__callback_ref` },
      })
    }
    return wrapped
  }, [ref])
}
