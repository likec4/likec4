// import { useStore } from '@xstate/store-react'
import { shallowEqual } from 'fast-equals'
import { createContext, useContext } from 'react'
import type { FloatingWindowContext, FloatingWindowStore } from './store'

const FloatingWindowStoreContext = createContext(null as unknown as FloatingWindowStore)

export const FloatingWindowStoreProvider = FloatingWindowStoreContext.Provider

export function useFloatingWindowsStore(): FloatingWindowStore {
  return useContext(FloatingWindowStoreContext)
}

export function useStore(): FloatingWindowStore
export function useStore<T>(
  select: (context: FloatingWindowContext) => T,
): T
export function useStore<T>(
  select: (context: FloatingWindowContext) => T,
  compare: (a: T | undefined, b: T) => boolean,
): T
export function useStore(...args: any[]) {
  const store = useContext(FloatingWindowStoreContext)
  if (args.length === 0) {
    return store
  }
  const select = args[0]
  const compare = args[1] ?? shallowEqual
  // return useSelector(store, s => select(s.context), compare)
  throw new Error('Not implemented')
}
