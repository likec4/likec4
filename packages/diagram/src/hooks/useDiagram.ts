import { type DiagramView, type EdgeId, type Fqn, type NodeId, type ViewId } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { useMemo, useTransition } from 'react'
import type { PartialDeep } from 'type-fest'
import type { FeatureName } from '../context/DiagramFeatures'
import type { OpenSourceParams } from '../LikeC4Diagram.props'
import type { Types } from '../likec4diagram/types'
import type { AlignmentMode } from '../state/aligners'
import type { DiagramActorSnapshot, DiagramContext, SyncLayoutActorRef, SyncLayoutActorSnapshot } from '../state/types'
import { findDiagramEdge, findDiagramNode } from '../state/utils'
import { useDiagramActorRef } from './safeContext'

export { useDiagramActorRef }

export function useDiagram() {
  const actor = useDiagramActorRef()
  const [, startTransition] = useTransition()
  return useMemo(() => ({
    actor,
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
      const syncState = actor.getSnapshot().children.syncLayout?.getSnapshot().value
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
    get currentView(): DiagramView {
      return actor.getSnapshot().context.view
    },
    /**
     * @warning Do not use in render phase
     */
    getSnapshot: () => actor.getSnapshot(),
    /**
     * @warning Do not use in render phase
     */
    getContext: () => actor.getSnapshot().context,
    /**
     * @warning Do not use in render phase
     */
    findDiagramNode: (xynodeId: string) => {
      return findDiagramNode(actor.getSnapshot().context, xynodeId)
    },
    /**
     * @warning Do not use in render phase
     */
    findDiagramEdge: (xyedgeId: string) => {
      return findDiagramEdge(actor.getSnapshot().context, xyedgeId)
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

export function useDiagramActorSnapshot<T = unknown>(
  selector: (state: DiagramActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
): T {
  const actorRef = useDiagramActorRef()
  return useXstateSelector(actorRef, useCallbackRef(selector), compare)
}

export function useDiagramSyncLayoutState<T = unknown>(
  selector: (state: SyncLayoutActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
): T {
  const syncLayoutActorRef = useDiagramActorSnapshot(s => s.context.syncLayoutActorRef as SyncLayoutActorRef)
  return useXstateSelector(syncLayoutActorRef, useCallbackRef(selector), compare)
}

export function useDiagramContext<T = unknown>(
  selector: (state: DiagramContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
) {
  return useDiagramActorSnapshot(useCallbackRef(s => selector(s.context)), compare)
}
