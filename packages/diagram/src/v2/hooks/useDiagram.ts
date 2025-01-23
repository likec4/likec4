import type { EdgeId, Fqn, NodeId, ViewId } from '@likec4/core'
import { useMemo, useTransition } from 'react'
import type { PartialDeep } from 'type-fest'
import type { Types } from '../types'
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
    openRelationshipsBrowser: (fqn: Fqn) => {
      startTransition(() => {
        actor.send({ type: 'open.relationshipsBrowser', fqn })
      })
    },
    openElementDetails: (fqn: Fqn, fromNode?: NodeId) => {
      startTransition(() => {
        actor.send({ type: 'open.elementDetails', fqn, fromNode })
      })
    },
    updateNodeData: (nodeId: NodeId, data: PartialDeep<Types.NodeData>) => {
      actor.send({ type: 'update.nodeData', nodeId, data })
    },
    updateEdgeData: (edgeId: EdgeId, data: PartialDeep<Types.Edge['data']>) => {
      actor.send({
        type: 'update.edgeData',
        edgeId,
        // @ts-expect-error TODO: fix this
        data,
      })
    },
    scheduleSaveManualLayout: () => {
      actor.send({ type: 'saveManualLayout.schedule' })
    },
    /**
     * @returns true if there was pending request to save layout
     */
    cancelSaveManualLayout: () => {
      const syncState = actor.getSnapshot().children.layout?.getSnapshot().value
      actor.send({ type: 'saveManualLayout.cancel' })
      return syncState === 'pending' || syncState === 'paused'
    },
  }), [actor])
}
