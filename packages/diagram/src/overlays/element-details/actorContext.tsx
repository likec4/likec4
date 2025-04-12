import { createContext, useContext } from 'react'
import type { ElementDetailsActorRef } from './actor'

/**
 * To improve experience with HMR, we use `createSafeContext` as a boundary for hoooks
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
