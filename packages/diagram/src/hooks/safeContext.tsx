import { createContext, useContext } from 'react'
import type { DiagramApi } from '../likec4diagram/state/diagram-api'

/**
 * To improve experience with HMR, we move context to separate files and use as a boundary for hoooks
 */
const DiagramActorSafeContext = createContext<DiagramApi>(null as any)
DiagramActorSafeContext.displayName = 'DiagramActorSafeContext'

export const DiagramActorContextProvider = DiagramActorSafeContext.Provider

export function useDiagramActorRef() {
  const ctx = useContext(DiagramActorSafeContext)
  if (ctx === null) {
    throw new Error('DiagramActorRef is not provided')
  }
  return ctx.actor
}

export function useDiagram() {
  const ctx = useContext(DiagramActorSafeContext)
  if (ctx === null) {
    throw new Error('DiagramActorRef is not provided')
  }
  return ctx
}
