import type { ElementDetailsActorRef } from './actor'
import { createContext, useContext } from 'react'

/**
 * To improve experience with HMR, we use `createSafeContext` as a boundary for hooks
 */
export const ElementDetailsActorContext = createContext<ElementDetailsActorRef>(null as any)
ElementDetailsActorContext.displayName = 'ElementDetailsActorContext'

export const useElementDetailsActorRef = () => {
  const ctx = useContext(ElementDetailsActorContext)
  if (ctx === null) {
    throw new Error('ElementDetailsActorRef is not provided')
  }
  return ctx
}
