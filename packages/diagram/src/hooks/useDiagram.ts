import type * as t from '@likec4/core/types'
import type {
  DynamicViewDisplayVariant,
  NodeNotation as ElementNotation,
  ViewChange,
} from '@likec4/core/types'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, useCallback, useEffect, useMemo, useRef } from 'react'
import type { PartialDeep } from 'type-fest'
import type { FeatureName } from '../context/DiagramFeatures'
import type { OpenSourceParams } from '../LikeC4Diagram.props'
import type { AlignmentMode } from '../likec4diagram/state/aligners'
import type {
  DiagramActorEvent,
  DiagramActorRef,
  DiagramActorSnapshot,
  DiagramContext,
  DiagramEmittedEvents,
} from '../likec4diagram/state/types'
import { findDiagramEdge, findDiagramNode, typedSystem } from '../likec4diagram/state/utils'
import type { Types } from '../likec4diagram/types'
import { useDiagramActorRef } from './safeContext'

type Any = t.aux.Any
type Unknown = t.aux.UnknownLayouted
type ViewId<A> = t.aux.ViewId<A>
type Fqn<A> = t.aux.Fqn<A>
type NodeId = t.aux.NodeId
type EdgeId = t.aux.EdgeId

export { useDiagramActorRef }

export type { DiagramContext }

export interface DiagramApi<A extends Any = Unknown> {
  readonly actor: DiagramActorRef
  /**
   * @warning Do not use in render phase
   */
  readonly currentView: t.DiagramView<A>
  /**
   * Send event to diagram actor
   */
  send(event: DiagramActorEvent): void
  /**
   * Navigate to view
   */
  navigateTo(viewId: ViewId<A>, fromNode?: NodeId): void
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
  openRelationshipsBrowser(fqn: Fqn<A>): void
  /**
   * If running in editor, trigger opening source file
   */
  openSource(params: OpenSourceParams<A>): void
  /**
   * Open element details card
   */
  openElementDetails(fqn: Fqn<A>, fromNode?: NodeId): void
  openRelationshipDetails(...params: [edgeId: EdgeId] | [source: Fqn<A>, target: Fqn<A>]): void
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
  findDiagramNode(xynodeId: string): t.DiagramNode<A> | null
  /**
   * @warning Do not use in render phase
   */
  findEdge(xyedgeId: string): Types.Edge | null
  /**
   * @warning Do not use in render phase
   */
  findDiagramEdge(xyedgeId: string): t.DiagramEdge<A> | null

  startWalkthrough(): void
  walkthroughStep(direction?: 'next' | 'previous'): void
  stopWalkthrough(): void
  toggleFeature(feature: FeatureName, forceValue?: boolean): void
  highlightNotation(notation: ElementNotation, kind?: string): void
  unhighlightNotation(): void
  openSearch(searchValue?: string): void
  triggerChange(viewChange: ViewChange): void
  /**
   * Switch dynamic view display variant
   */
  switchDynamicViewVariant(variant: DynamicViewDisplayVariant): void
}

/**
 * Diagram API
 * Mostly for internal use
 */
export function useDiagram<A extends Any = Unknown>(): DiagramApi<A> {
  const actor = useDiagramActorRef()
  return useMemo((): DiagramApi<A> => ({
    actor,
    send: (event: DiagramActorEvent) => actor.send(event),
    navigateTo: (viewId: ViewId<A>, fromNode?: NodeId) => {
      actor.send({
        type: 'navigate.to',
        viewId: viewId as any,
        ...(fromNode && { fromNode }),
      })
    },
    navigate: (direction: 'back' | 'forward') => {
      actor.send({ type: `navigate.${direction}` })
    },
    fitDiagram: (duration = 350) => {
      actor.send({ type: 'fitDiagram', duration })
    },
    openRelationshipsBrowser: (fqn) => {
      actor.send({ type: 'open.relationshipsBrowser', fqn })
    },
    openSource: (params: OpenSourceParams<Unknown>) => {
      actor.send({ type: 'open.source', ...params })
    },
    openElementDetails: (fqn, fromNode?: NodeId) => {
      actor.send({ type: 'open.elementDetails', fqn, fromNode })
    },
    openRelationshipDetails: (...params: [edgeId: EdgeId] | [source: Fqn<A>, target: Fqn<A>]) => {
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
      const syncState = typedSystem(actor.system).syncLayoutActorRef?.getSnapshot().value
      const isPending = syncState === 'pending' || syncState === 'paused'
      if (isPending) {
        actor.send({ type: 'saveManualLayout.pause' })
      } else {
        actor.send({ type: 'saveManualLayout.cancel' })
      }
      return isPending
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
    get currentView(): t.DiagramView<A> {
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
    findDiagramNode: (xynodeId: string): t.DiagramNode<A> | null => {
      return findDiagramNode(actor.getSnapshot().context, xynodeId)
    },
    findEdge: (xyedgeId: string): Types.Edge | null => {
      return actor.getSnapshot().context.xyedges.find(e => e.data.id === xyedgeId) ?? null
    },
    /**
     * @warning Do not use in render phase
     */
    findDiagramEdge: (xyedgeId: string): t.DiagramEdge<A> | null => {
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

    triggerChange: (change: ViewChange) => {
      actor.send({ type: 'emit.onChange', change })
    },

    switchDynamicViewVariant: (variant: DynamicViewDisplayVariant) => {
      actor.send({ type: 'switch.dynamicViewVariant', variant })
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

type PickEmittedEvent<T> = T extends DiagramEmittedEvents['type'] ? DiagramEmittedEvents & { type: T } : never

/**
 * Subscribe to diagram emitted events
 * @example
 * ```tsx
 * useOnDiagramEvent('navigateTo', ({viewId}) => {
 *   console.log('Navigating to view', viewId)
 * })
 * ```
 */
export function useOnDiagramEvent<T extends DiagramEmittedEvents['type']>(
  event: T,
  callback: (event: PickEmittedEvent<T>) => void,
): void {
  const actorRef = useDiagramActorRef()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const subscription = actorRef.on(event, (payload) => {
      callbackRef.current(payload as PickEmittedEvent<T>)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [actorRef, event])
}
