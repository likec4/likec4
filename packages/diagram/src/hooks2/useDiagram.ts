import type { EdgeId, Fqn, NodeId, ViewId } from '@likec4/core'
import { useMemo, useTransition } from 'react'
import type { PartialDeep } from 'type-fest'
import type { AlignmentMode } from '../likec4diagram/state/aligners'
import type { Types } from '../likec4diagram/types'
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
    fitDiagram: (duration = 350) => {
      startTransition(() => {
        actor.send({ type: 'fitDiagram', duration })
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
      const syncState = actor.getSnapshot().context.syncLayoutActorRef.getSnapshot().value
      actor.send({ type: 'saveManualLayout.cancel' })
      return syncState === 'pending' || syncState === 'paused'
    },

    align: (mode: AlignmentMode) => {
      actor.send({ type: 'layout.align', mode })
    },

    resetEdgeControlPoints: () => {
      actor.send({ type: 'layout.resetEdgeControlPoints' })
    },

    focusNode: (nodeId: NodeId) => {
      actor.send({ type: 'focus.node', nodeId })
    },

    getDiagramNode: (nodeId: NodeId) => {
      return actor.getSnapshot().context.view.nodes.find(n => n.id === nodeId) ?? null
    },

    getDiagramEdge: (edgeId: EdgeId) => {
      return actor.getSnapshot().context.view.edges.find(e => e.id === edgeId) ?? null
    },
  }), [actor])
}
