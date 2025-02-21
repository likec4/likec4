import { type Fqn, nonNullable } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { createContext, useContext, useMemo, useTransition } from 'react'
import type { OverlaysActorRef } from '../overlaysActor'
import type { RelationshipsBrowserActorRef, RelationshipsBrowserSnapshot } from './actor'

export const RelationshipsBrowserActorContext = createContext<RelationshipsBrowserActorRef | null>(null)

export function useRelationshipsBrowserActor() {
  return nonNullable(useContext(RelationshipsBrowserActorContext), 'No RelationshipsBrowserActorContext')
}

export function useRelationshipsBrowserState<T>(
  selector: (state: RelationshipsBrowserSnapshot) => T,
  compare: (a: T, b: T) => boolean = shallowEqual,
) {
  const actor = useRelationshipsBrowserActor()
  return useSelector(actor, useCallbackRef(selector), compare)
}

export function useRelationshipsBrowser() {
  const actor = useRelationshipsBrowserActor()
  const [, startTransition] = useTransition()
  return useMemo(() => ({
    actor,
    getState: () => actor.getSnapshot().context,
    send: actor.send,
    navigateTo: (subject: Fqn, fromNode?: string) => {
      startTransition(() => {
        actor.send({
          type: 'navigate.to',
          subject,
          fromNode,
        })
      })
    },
    fitDiagram: () => {
      startTransition(() => {
        actor.send({ type: 'fitDiagram' })
      })
    },
    close: () => {
      if (actor._parent) {
        ;(actor._parent as OverlaysActorRef)?.send({ type: 'close', actorId: actor.id })
      } else {
        actor.send({ type: 'close' })
      }
    },
  }), [actor])
}
