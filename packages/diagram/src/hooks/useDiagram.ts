import type { EdgeId, Fqn, NodeId, ViewId } from '@likec4/core'
import { useMemo, useTransition } from 'react'
import type { PartialDeep } from 'type-fest'
import type { FeatureName } from '../context/DiagramFeatures'
import { useDiagramActor } from '../hooks/useDiagramActor'
import type { OpenSourceParams } from '../LikeC4Diagram.props'
import type { AlignmentMode } from '../likec4diagram/state/aligners'
import { DiagramContext } from '../likec4diagram/state/machine'
import type { Types } from '../likec4diagram/types'

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
    openSource: (params: OpenSourceParams) => {
      actor.send({ type: 'open.source', ...params })
    },
    openElementDetails: (fqn: Fqn, fromNode?: NodeId) => {
      startTransition(() => {
        actor.send({ type: 'open.elementDetails', fqn, fromNode })
      })
    },
    openRelationshipDetails: (edgeId: EdgeId) => {
      startTransition(() => {
        actor.send({ type: 'open.relationshipDetails', edgeId })
      })
    },
    closeOverlay: () => {
      startTransition(() => {
        actor.send({ type: 'close.overlay' })
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

    /**
     * @warning Do not use in render phase
     */
    currentView: () => actor.getSnapshot().context.view,
    /**
     * @warning Do not use in render phase
     */
    getState: () => actor.getSnapshot(),
    /**
     * @warning Do not use in render phase
     */
    getContext: () => actor.getSnapshot().context,
    /**
     * @warning Do not use in render phase
     */
    findDiagramNode: (xynodeId: string) => {
      return DiagramContext.findDiagramNode(actor.getSnapshot().context, xynodeId)
    },
    /**
     * @warning Do not use in render phase
     */
    findDiagramEdge: (xyedgeId: string) => {
      return DiagramContext.findDiagramEdge(actor.getSnapshot().context, xyedgeId)
    },

    startWalkthrough: () => {
      actor.send({ type: 'walkthrough.start' })
    },

    walkthroughStep: (direction: 'next' | 'previous' = 'next') => {
      actor.send({ type: 'walkthrough.step', direction })
    },

    stopWalkthrough: () => {
      actor.send({ type: 'walkthrough.end' })
    },

    toggleFeature: (feature: FeatureName, forceValue?: boolean) => {
      actor.send({ type: 'toggle.feature', feature, ...(forceValue !== undefined && { forceValue }) })
    },
  }), [actor])
}
