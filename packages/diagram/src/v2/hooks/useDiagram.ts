import type { NodeId } from '@likec4/core'
import type { ViewId } from '@likec4/core'
import { useMemo, useTransition } from 'react'
import { useDiagramActor } from './useDiagramActor'

export function useDiagram() {
  const actor = useDiagramActor()
  const [, startTransition] = useTransition()
  return useMemo(() => ({
    send: actor.send,
    navigateTo: (viewId: ViewId, fromNode?: NodeId) => {
      startTransition(() => {
        actor.send({
          type: 'navigate.to',
          viewId,
          ...(fromNode && { fromNode }),
        })
      })
    },
    navigate: (direction: 'back' | 'forward') => {
      startTransition(() => {
        actor.send({ type: `navigate.${direction}` })
      })
    },
    fitDiagram: () => {
      startTransition(() => {
        actor.send({ type: 'fitDiagram' })
      })
    },
  }), [actor])
}
