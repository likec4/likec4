import type { PlaygroundActorRef } from '$state/types'
import { createContext, use } from 'react'

/**
 * To improve experience with HMR, we use `createSafeContext` as a boundary for hoooks
 */
export const PlaygroundActorSafeContext = createContext<PlaygroundActorRef>(null as any)
PlaygroundActorSafeContext.displayName = 'PlaygroundActorSafeContext'

export const _useOptionalPlaygroundActorRef = () => {
  return use(PlaygroundActorSafeContext) as PlaygroundActorRef | null
}

export const _usePlaygroundActorRef = () => {
  const ctx = use(PlaygroundActorSafeContext)
  if (ctx === null) {
    throw new Error('PlaygroundActorRef is not provided')
  }
  return ctx
}
