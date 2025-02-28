import { createSafeContext } from '@mantine/core'
import { createContext, use, useContext } from 'react'
import type { DiagramActorRef } from '../state/types'

/**
 * To improve experience with HMR, we use `createSafeContext` as a boundary for hoooks
 */
export const DiagramActorSafeContext = createContext<DiagramActorRef>(null as any)
DiagramActorSafeContext.displayName = 'DiagramActorSafeContext'

export const useDiagramActorRef = () => {
  const ctx = use(DiagramActorSafeContext)
  if (ctx === null) {
    throw new Error('DiagramActorRef is not provided')
  }
  return ctx
}
