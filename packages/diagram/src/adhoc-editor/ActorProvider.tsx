import { useLogger } from '@mantine/hooks'
import { useActorRef } from '@xstate/react'
import { type PropsWithChildren, createContext, useEffect, useRef } from 'react'
import { fromPromise } from 'xstate'
import { type AdhocEditorActorRef, adhocEditorLogic } from './actor'
import type { AdhocViewService } from './actor.types'

export const AdhocEditorActorContext = createContext<AdhocEditorActorRef | null>(null)

const State = {
  read: () => JSON.parse(sessionStorage.getItem('adhoc-editor-state') || 'null') ?? undefined as any,
  write: (state: unknown) => sessionStorage.setItem('adhoc-editor-state', JSON.stringify(state)),
}

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
    {
      id: 'adhoc-editor',
      snapshot: State.read(),
      systemId: 'adhoc-editor',
      inspect: (event) => {
        console.log('[AdhocEditorActor]', event)
      },
    },
  )
  useLogger('AdhocEditorActor', [actorRef])

  useEffect(() => {
    const subscription = actorRef.subscribe((state) => {
      State.write(state)
    })
    return () => subscription.unsubscribe()
  }, [actorRef])

  return (
    <AdhocEditorActorContext.Provider value={actorRef}>
      {children}
    </AdhocEditorActorContext.Provider>
  )
}
