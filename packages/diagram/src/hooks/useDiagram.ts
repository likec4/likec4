import {
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  type EdgeId,
  type Fqn,
  type NodeId,
  type NodeNotation as ElementNotation,
  type ViewId,
} from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, useCallback, useMemo } from 'react'
import type { PartialDeep } from 'type-fest'
import type { FeatureName } from '../context/DiagramFeatures'
import type { OpenSourceParams } from '../LikeC4Diagram.props'
import type { Types } from '../likec4diagram/types'
import type { AlignmentMode } from '../state/aligners'
import type {
  DiagramActorEvent,
  DiagramActorRef,
  DiagramActorSnapshot,
  DiagramContext,
  SyncLayoutActorRef,
  SyncLayoutActorSnapshot,
} from '../state/types'
import { findDiagramEdge, findDiagramNode } from '../state/utils'
import { useDiagramActorRef } from './safeContext'

export { useDiagramActorRef }

export interface DiagramApi {
  readonly actor: DiagramActorRef
  /**
   * @warning Do not use in render phase
   */
  readonly currentView: DiagramView
  /**
   * Send event to diagram actor
   */
  send(event: DiagramActorEvent): void
  /**
   * Navigate to view
   */
  navigateTo(viewId: ViewId, fromNode?: NodeId): void
  /**
   * Navigate back or forward in history
   */
  navigate(direction: 'back' | 'forward'): void
  /**
   * Fit diagram to view
   */
  fitDiagram(duration?: number): void
  /**
   * Open relationships browser
   */
  openRelationshipsBrowser(fqn: Fqn): void
  /**
   * If running in editor, trigger opening source file
   */
  openSource(params: OpenSourceParams): void
  /**
   * Open element details card
   */
  openElementDetails(fqn: Fqn, fromNode?: NodeId): void
  openRelationshipDetails(...params: [edgeId: EdgeId] | [source: Fqn, target: Fqn]): void
  updateNodeData(nodeId: NodeId, data: PartialDeep<Types.NodeData>): void
  updateEdgeData(edgeId: EdgeId, data: PartialDeep<Types.EdgeData>): void
  /**
   * Schedule save manual layout
   */
  scheduleSaveManualLayout(): void
  /**
   * @returns true if there was pending request to save layout
   */
  cancelSaveManualLayout(): boolean
  /**
   * Align nodes
   */
  align(mode: AlignmentMode): void
  /**
   * Reset edge control points
   */
  resetEdgeControlPoints(): void
  /**
   * Focus node
   */
  focusNode(nodeId: NodeId): void

  /**
   * @warning Do not use in render phase
   */
  getSnapshot(): DiagramActorSnapshot
  /**
   * @warning Do not use in render phase
   */
  getContext(): DiagramContext
  /**
   * @warning Do not use in render phase
   */
  findDiagramNode(xynodeId: string): DiagramNode | null
  /**
   * @warning Do not use in render phase
   */
  findDiagramEdge(xyedgeId: string): DiagramEdge | null
  startWalkthrough(): void
  walkthroughStep(direction?: 'next' | 'previous'): void
  stopWalkthrough(): void
  toggleFeature(feature: FeatureName, forceValue?: boolean): void
  highlightNotation(notation: ElementNotation, kind?: string): void
  unhighlightNotation(): void
  openSearch(searchValue?: string): void
}

/**
 * Diagram API
 * Mostly for internal use
 */
export function useDiagram(): DiagramApi {
  const actor = useDiagramActorRef()
  return useMemo(() => ({
    actor,
    send: (event: DiagramActorEvent) => actor.send(event),
    navigateTo: (viewId: ViewId, fromNode?: NodeId) => {
      actor.send({
        type: 'navigate.to',
        viewId,
        ...(fromNode && { fromNode }),
      })
    },
    navigate: (direction: 'back' | 'forward') => {
      actor.send({ type: `navigate.${direction}` })
    },
    fitDiagram: (duration = 350) => {
      actor.send({ type: 'fitDiagram', duration })
    },
    openRelationshipsBrowser: (fqn: Fqn) => {
      actor.send({ type: 'open.relationshipsBrowser', fqn })
    },
    openSource: (params: OpenSourceParams) => {
      actor.send({ type: 'open.source', ...params })
    },
    openElementDetails: (fqn: Fqn, fromNode?: NodeId) => {
      actor.send({ type: 'open.elementDetails', fqn, fromNode })
    },
    openRelationshipDetails: (...params: [edgeId: EdgeId] | [source: Fqn, target: Fqn]) => {
      if (params.length === 1) {
        actor.send({ type: 'open.relationshipDetails', params: { edgeId: params[0] } })
      } else {
        actor.send({ type: 'open.relationshipDetails', params: { source: params[0], target: params[1] } })
      }
    },

    updateNodeData: (nodeId: NodeId, data: PartialDeep<Types.NodeData>) => {
      actor.send({ type: 'update.nodeData', nodeId, data })
    },
    updateEdgeData: (edgeId: EdgeId, data: PartialDeep<Types.EdgeData>) => {
      actor.send({
        type: 'update.edgeData',
        edgeId,
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
    getSnapshot: (): DiagramActorSnapshot => actor.getSnapshot(),
    /**
     * @warning Do not use in render phase
     */
    getContext: (): DiagramContext => actor.getSnapshot().context,
    /**
     * @warning Do not use in render phase
     */
    findDiagramNode: (xynodeId: string): DiagramNode | null => {
      return findDiagramNode(actor.getSnapshot().context, xynodeId)
    },
    /**
     * @warning Do not use in render phase
     */
    findDiagramEdge: (xyedgeId: string): DiagramEdge | null => {
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

    highlightNotation: (notation: ElementNotation, kind?: string) => {
      actor.send({ type: 'notations.highlight', notation, ...(kind && { kind }) })
    },
    unhighlightNotation: () => {
      actor.send({ type: 'notations.unhighlight' })
    },

    openSearch: (searchValue?: string) => {
      actor.send({ type: 'open.search', ...(searchValue && { search: searchValue }) })
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

/**
 * Read diagram context
 */
export function useDiagramContext<T = unknown>(
  selector: (context: DiagramContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps?: DependencyList,
): T {
  const actorRef = useDiagramActorRef()
  const select = useCallback((s: DiagramActorSnapshot) => selector(s.context), deps ?? [])
  return useXstateSelector(actorRef, select, compare)
}
