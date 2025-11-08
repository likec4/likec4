import { type Fqn, nonNullable } from '@likec4/core'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { createContext, useContext, useMemo } from 'react'
import { useCallbackRef } from '../../hooks/useCallbackRef'
import type { OverlaysActorRef } from '../overlaysActor'
import type { RelationshipsBrowserActorRef, RelationshipsBrowserSnapshot } from './actor'
import type { LayoutRelationshipsViewResult } from './layout'

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
  return useMemo(() => ({
    actor,
    get rootElementId(): string {
      return `relationships-browser-${actor.sessionId.replaceAll(':', '_')}`
    },
    getState: () => actor.getSnapshot().context,
    send: actor.send,
    updateView: (layouted: LayoutRelationshipsViewResult) => {
      if (actor.getSnapshot().status === 'active') {
        actor.send({
          type: 'update.view',
          layouted,
        })
      }
    },
    changeScope: (scope: 'global' | 'view') => {
      actor.send({
        type: 'change.scope',
        scope,
      })
    },
    navigateTo: (subject: Fqn, fromNode?: string) => {
      actor.send({
        type: 'navigate.to',
        subject,
        fromNode,
      })
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
