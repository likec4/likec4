import { type Fqn, nonNullable } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector } from '@xstate/react'
import { useStoreApi } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { createContext, useContext, useMemo, useTransition } from 'react'
import { useOverlays } from '../../hooks/useOverlays'
import type { RelationshipsBrowserActorRef, RelationshipsBrowserSnapshot } from './actor'

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
  const overlays = useOverlays()
  const actor = useRelationshipsBrowserActor()
  const [, startTransition] = useTransition()
  return useMemo(() => ({
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
      overlays.close(actor)
    },
  }), [actor])
}
