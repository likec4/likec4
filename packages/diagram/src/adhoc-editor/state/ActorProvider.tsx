import { useActorRef } from '@xstate/react'
import { type PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { fromPromise } from 'xstate'
import { AdhocEditorActorContextProvider } from '../hooks'
import { adhocEditorLogic } from './actor'
import type { AdhocViewService, AdhocViewServiceActor } from './actor.types'

const State = {
  read: () => JSON.parse(sessionStorage.getItem('adhoc-editor-state') || 'null') ?? undefined as any,
  write: (state: unknown) => sessionStorage.setItem('adhoc-editor-state', JSON.stringify(state)),
}

export function AdhocEditorActorProvider({ children, service }: PropsWithChildren<{
  service: AdhocViewService
}>) {
  const serviceRef = useRef(service)
  serviceRef.current = service

  const provided = useMemo(() => ({
    actors: {
      service: fromPromise(({ input }) => serviceRef.current.process(input)),
    } satisfies {
      service: AdhocViewServiceActor
    },
  }), [])

  const actorRef = useActorRef(
    adhocEditorLogic.provide(provided),
    {
      id: 'adhoc-editor',
      snapshot: State.read(),
      systemId: 'adhoc-editor',
      inspect: (event) => {
        console.log('[AdhocEditorActor]', event)
      },
    },
  )

  useEffect(() => {
    const subscription = actorRef.subscribe((state) => {
      State.write(state)
    })
    return () => subscription.unsubscribe()
  }, [actorRef])

  return (
    <AdhocEditorActorContextProvider value={actorRef}>
      {children}
    </AdhocEditorActorContextProvider>
  )
}
