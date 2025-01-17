import { type Fqn, nonNullable } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { createContext, useContext, useMemo, useTransition } from 'react'
import type { RelationshipsBrowserActorRef, RelationshipsBrowserSnapshot } from './state'

export const RelationshipsBrowserActorContext = createContext<RelationshipsBrowserActorRef | null>(null)

export function useRelationshipsBrowserActor() {
  return nonNullable(useContext(RelationshipsBrowserActorContext), 'No RelationshipsBrowserActorContext')
}

export function useRelationshipsBrowserState<T>(
  selector: (state: RelationshipsBrowserSnapshot) => T,
  compare: (a: T, b: T) => boolean = shallowEqual,
) {
  const select = useCallbackRef(selector)
  const actor = useRelationshipsBrowserActor()
  return useSelector(actor, select, compare)
}

export function useRelationshipsBrowser() {
  const actor = useRelationshipsBrowserActor()
  const [, startTransition] = useTransition()
  return useMemo(() => ({
    getState: () => actor.getSnapshot().context,
    send: actor.send,
    navigateTo: (subject: Fqn) => {
      startTransition(() => {
        actor.send({
          type: 'navigate.to',
          subject,
        })
      })
    },
    fitDiagram: () => {
      startTransition(() => {
        actor.send({ type: 'fitDiagram' })
      })
    },
    close: () => {
      startTransition(() => {
        actor.send({ type: 'close' })
      })
    },
  }), [actor])
}
