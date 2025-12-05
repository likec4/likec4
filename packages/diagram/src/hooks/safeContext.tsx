import { createContext, useContext } from 'react'
import type { DiagramActorRef } from '../custom'
import type { DiagramApi } from '../likec4diagram/state/diagram-api'

/**
 * To improve experience with HMR, we move context to separate files and use as a boundary for hoooks
 */
const DiagramActorSafeContext = createContext<DiagramActorRef>(null as any)
DiagramActorSafeContext.displayName = 'DiagramActorSafeContext'

const DiagramApiSafeContext = createContext<DiagramApi>(null as any)
DiagramApiSafeContext.displayName = 'DiagramApiSafeContext'

export const DiagramActorContextProvider = DiagramActorSafeContext.Provider
export const DiagramApiContextProvider = DiagramApiSafeContext.Provider

export function useDiagramActorRef() {
  const ctx = useContext(DiagramActorSafeContext)
  if (ctx === null) {
    throw new Error('DiagramActorRef is not provided')
  }
  return ctx
}

export function useDiagram() {
  const ctx = useContext(DiagramApiSafeContext)
  if (ctx === null) {
    throw new Error('DiagramApi is not provided')
  }
  return ctx
}
