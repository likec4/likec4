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
          type: 'navigateTo',
          viewId,
          ...(fromNode && { fromNode }),
        })
      })
    },
    fitDiagram: () => {
      startTransition(() => {
        actor.send({ type: 'fitDiagram' })
      })
    },
  }), [actor])
}
