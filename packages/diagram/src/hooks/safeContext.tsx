import { type Provider, createContext, useContext } from 'react'
import type { DiagramApi } from '../likec4diagram/state/diagram-api'
import type { DiagramActorRef } from '../likec4diagram/state/types'

/**
 * To improve experience with HMR, we move context to separate files and use as a boundary for hooks
 */
const DiagramActorSafeContext = createContext<DiagramActorRef>(null as any)
DiagramActorSafeContext.displayName = 'DiagramActorSafeContext'

const DiagramApiSafeContext = createContext<DiagramApi>(null as any)
DiagramApiSafeContext.displayName = 'DiagramApiSafeContext'

export const DiagramActorContextProvider: Provider<DiagramActorRef> = DiagramActorSafeContext.Provider
export const DiagramApiContextProvider: Provider<DiagramApi> = DiagramApiSafeContext.Provider

export function useDiagramActorRef(): DiagramActorRef {
  const ctx = useContext(DiagramActorSafeContext)
  if (ctx === null) {
    throw new Error('DiagramActorRef is not provided')
  }
  return ctx
}

export function useDiagram(): DiagramApi {
  const ctx = useContext(DiagramApiSafeContext)
  if (ctx === null) {
    throw new Error('DiagramApi is not provided')
  }
  return ctx
}
