import { type EdgeId, nonNullable } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { createContext, useContext, useMemo, useTransition } from 'react'
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
  const [, startTransition] = useTransition()
  return useMemo(() => ({
    getState: () => actor.getSnapshot().context,
    send: actor.send,
    navigateTo: (edgeId: EdgeId) => {
      startTransition(() => {
        actor.send({
          type: 'navigate.to',
          edgeId,
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
