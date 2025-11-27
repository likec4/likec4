import type * as t from '@likec4/core/types'
import type {
  DynamicViewDisplayVariant,
  NodeNotation as ElementNotation,
  ViewChange,
} from '@likec4/core/types'
import { invariant, nonNullable } from '@likec4/core/utils'
import type { Ref, RefObject } from 'react'
import type { PartialDeep } from 'type-fest'
import type { FeatureName, TogglableFeature } from '../../context/DiagramFeatures'
import type { OpenSourceParams } from '../../LikeC4Diagram.props'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { Types } from '../types'
import type { AlignmentMode } from './aligners'
import type {
  DiagramActorRef,
  DiagramContext,
  DiagramEvents,
} from './types'
import { findDiagramEdge, findDiagramNode, typedSystem } from './utils'

type Any = t.aux.Any
type Unknown = t.aux.UnknownLayouted
type ViewId<A> = t.aux.ViewId<A>
type Fqn<A> = t.aux.Fqn<A>
type NodeId = t.aux.NodeId
type EdgeId = t.aux.EdgeId

export interface DiagramApi<A extends Any = Unknown> {
  /**
   * React ref to the diagram actor
   */
  readonly ref: RefObject<DiagramActorRef>
  /**
   * @warning Do not use in render phase
   */
  readonly actor: DiagramActorRef
  /**
   * @warning Do not use in render phase
   */
  readonly currentView: t.DiagramView<A>

  overlays(): OverlaysActorRef
  /**
   * Send event to diagram actor
   */
  send(event: DiagramEvents): void
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
   * Start editing, either node or edge
   */
  startEditing(subject: 'node' | 'edge'): void
  /**
   * Stop editing
   * @param wasChanged - whether there were changes made during editing
   * @default false
   */
  stopEditing(wasChanged?: boolean): void
  /**
   * Undo last editing operation
   * @returns true if there was something to undo
   */
  undoEditing(): boolean
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

export function makeDiagramApi<A extends Any = Unknown>(actorRef: RefObject<DiagramActorRef>): DiagramApi<A> {
  return {
    ref: actorRef,
    get actor(): DiagramActorRef {
      return actorRef.current
    },
    overlays(): OverlaysActorRef {
      return nonNullable(actorRef.current.getSnapshot().children.overlays, 'Overlays actor not found')
    },
    send: (event: DiagramEvents) => actorRef.current.send(event),
    navigateTo: (viewId: ViewId<A>, fromNode?: NodeId) => {
      actorRef.current.send({
        type: 'navigate.to',
        viewId: viewId as any,
        ...(fromNode && { fromNode }),
      })
    },
    navigate: (direction: 'back' | 'forward') => {
      actorRef.current.send({ type: `navigate.${direction}` })
    },
    fitDiagram: (duration = 350) => {
      actorRef.current.send({ type: 'xyflow.fitDiagram', duration })
    },
    openRelationshipsBrowser: (fqn) => {
      actorRef.current.send({ type: 'open.relationshipsBrowser', fqn })
    },
    openSource: (params: OpenSourceParams<Unknown>) => {
      actorRef.current.send({ type: 'open.source', ...params })
    },
    openElementDetails: (fqn, fromNode?: NodeId) => {
      actorRef.current.send({ type: 'open.elementDetails', fqn, fromNode })
    },
    openRelationshipDetails: (...params: [edgeId: EdgeId] | [source: Fqn<A>, target: Fqn<A>]) => {
      if (params.length === 1) {
        actorRef.current.send({ type: 'open.relationshipDetails', params: { edgeId: params[0] } })
      } else {
        actorRef.current.send({ type: 'open.relationshipDetails', params: { source: params[0], target: params[1] } })
      }
    },

    updateNodeData: (nodeId: NodeId, data: PartialDeep<Types.NodeData>) => {
      actorRef.current.send({ type: 'update.nodeData', nodeId, data })
    },
    updateEdgeData: (edgeId: EdgeId, data: PartialDeep<Types.EdgeData>) => {
      actorRef.current.send({ type: 'update.edgeData', edgeId, data })
    },
    startEditing: (subject: 'node' | 'edge') => {
      const syncActor = typedSystem(actorRef.current.system).syncLayoutActorRef
      invariant(syncActor, 'No sync layout actor found in diagram actor system')
      syncActor.send({ type: 'editing.start', subject })
    },
    stopEditing: (wasChanged = false) => {
      const syncActor = typedSystem(actorRef.current.system).syncLayoutActorRef
      invariant(syncActor, 'No sync layout actor found in diagram actor system')
      syncActor.send({ type: 'editing.stop', wasChanged })
    },
    undoEditing: () => {
      const syncActor = typedSystem(actorRef.current.system).syncLayoutActorRef
      invariant(syncActor, 'No sync layout actor found in diagram actor system')
      const hasUndo = syncActor.getSnapshot().context.history.length > 0
      if (hasUndo) {
        syncActor.send({ type: 'undo' })
      }
      return hasUndo
    },

    align: (mode: AlignmentMode) => {
      actorRef.current.send({ type: 'layout.align', mode })
    },

    resetEdgeControlPoints: () => {
      actorRef.current.send({ type: 'layout.resetEdgeControlPoints' })
    },

    focusNode: (nodeId: NodeId) => {
      actorRef.current.send({ type: 'focus.node', nodeId })
    },

    /**
     * @warning Do not use in render phase
     */
    get currentView(): t.DiagramView<A> {
      return actorRef.current.getSnapshot().context.view
    },
    /**
     * @warning Do not use in render phase
     */
    getContext: (): DiagramContext => actorRef.current.getSnapshot().context,
    /**
     * @warning Do not use in render phase
     */
    findDiagramNode: (xynodeId: string): t.DiagramNode<A> | null => {
      return findDiagramNode(actorRef.current.getSnapshot().context, xynodeId)
    },
    findEdge: (xyedgeId: string): Types.Edge | null => {
      return actorRef.current.getSnapshot().context.xyedges.find(e => e.data.id === xyedgeId) ?? null
    },
    /**
     * @warning Do not use in render phase
     */
    findDiagramEdge: (xyedgeId: string): t.DiagramEdge<A> | null => {
      return findDiagramEdge(actorRef.current.getSnapshot().context, xyedgeId)
    },

    startWalkthrough: () => {
      actorRef.current.send({ type: 'walkthrough.start' })
    },

    walkthroughStep: (direction: 'next' | 'previous' = 'next') => {
      actorRef.current.send({ type: 'walkthrough.step', direction })
    },

    stopWalkthrough: () => {
      actorRef.current.send({ type: 'walkthrough.end' })
    },

    toggleFeature: (feature: TogglableFeature, forceValue?: boolean) => {
      actorRef.current.send({ type: 'toggle.feature', feature, ...(forceValue !== undefined && { forceValue }) })
    },

    highlightNotation: (notation: ElementNotation, kind?: string) => {
      actorRef.current.send({ type: 'notations.highlight', notation, ...(kind && { kind }) })
    },
    unhighlightNotation: () => {
      actorRef.current.send({ type: 'notations.unhighlight' })
    },

    openSearch: (searchValue?: string) => {
      actorRef.current.send({ type: 'open.search', ...(searchValue && { search: searchValue }) })
    },

    triggerChange: (change: ViewChange) => {
      actorRef.current.send({ type: 'emit.onChange', change })
    },

    switchDynamicViewVariant: (variant: DynamicViewDisplayVariant) => {
      actorRef.current.send({ type: 'switch.dynamicViewVariant', variant })
    },
  }
}
