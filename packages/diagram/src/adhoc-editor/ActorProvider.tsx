import { useActorRef } from '@xstate/react'
import { type PropsWithChildren, createContext, useRef } from 'react'
import { fromPromise } from 'xstate'
import { type AdhocEditorActorRef, adhocEditorLogic } from './actor'
import type { AdhocViewService } from './actor.types'

export const AdhocEditorActorContext = createContext<AdhocEditorActorRef | null>(null)

export function AdhocEditorActorProvider({ children, service }: PropsWithChildren<{
  service: AdhocViewService
}>) {
  const serviceRef = useRef(service)
  serviceRef.current = service

  const actorRef = useActorRef(
    adhocEditorLogic.provide({
      actors: {
        service: fromPromise(({ input }) => serviceRef.current.process(input)),
      },
    }),
    {},
  )
  return (
    <AdhocEditorActorContext.Provider value={actorRef}>
      {children}
    </AdhocEditorActorContext.Provider>
  )
}
