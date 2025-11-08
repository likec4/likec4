import { useRef } from 'react'

export function useCallbackRef<T extends (...args: any[]) => any>(callback: T | null | undefined): T {
  const ref = useRef(callback)
  ref.current = callback

  const callbackRef = useRef<T>(null)
  if (callbackRef.current == null) {
    callbackRef.current = ((...args: any[]) => ref.current?.(...args)) as T
  }

  return callbackRef.current
}
