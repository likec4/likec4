import { type EdgeId, type Fqn, nonNullable } from '@likec4/core'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { createContext, useContext, useMemo } from 'react'
import { useCallbackRef } from '../../hooks/useCallbackRef'
import type { OverlaysActorRef } from '../overlaysActor'
import type { RelationshipDetailsActorRef, RelationshipDetailsSnapshot } from './actor'

export const RelationshipDetailsActorContext = createContext<RelationshipDetailsActorRef | null>(null)

export function useRelationshipDetailsActor() {
  return nonNullable(useContext(RelationshipDetailsActorContext), 'No RelationshipDetailsActorContext')
}

export function useRelationshipDetailsState<T = unknown>(
  selector: (state: RelationshipDetailsSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
) {
  const select = useCallbackRef(selector)
  const actor = useRelationshipDetailsActor()
  return useSelector(actor, select, compare)
}

export function useRelationshipDetails() {
  const actor = useRelationshipDetailsActor()
  return useMemo(() => ({
    actor,
    get rootElementId(): string {
      return `relationship-details-${actor.sessionId.replaceAll(':', '_')}`
    },
    getState: () => actor.getSnapshot().context,
    send: actor.send,
    navigateTo: (...params: [edgeId: EdgeId] | [source: Fqn, target: Fqn]) => {
      if (params.length === 1) {
        actor.send({ type: 'navigate.to', params: { edgeId: params[0] } })
      } else {
        actor.send({ type: 'navigate.to', params: { source: params[0], target: params[1] } })
      }
    },
    fitDiagram: () => {
      actor.send({ type: 'fitDiagram' })
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
