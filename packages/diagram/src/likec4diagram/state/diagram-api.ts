import type * as t from '@likec4/core/types'
import type {
  DynamicViewDisplayVariant,
  NodeNotation as ElementNotation,
  ViewChange,
} from '@likec4/core/types'
import { DefaultWeakMap, invariant, nonNullable } from '@likec4/core/utils'
import type { RefObject } from 'react'
import type { PartialDeep } from 'type-fest'
import type { TogglableFeature } from '../../context/DiagramFeatures'
import type { EditorActorRef } from '../../editor/actor/machine'
import type { OpenSourceParams } from '../../LikeC4Diagram.props'
import type { OverlaysActorRef } from '../../overlays/overlaysActor'
import type { SearchActorRef } from '../../search/searchActor'
import type { Types } from '../types'
import type { AlignmentMode } from './aligners'
import type {
  DiagramActorRef,
  DiagramContext,
  DiagramEvents,
} from './types'
import { findDiagramEdge, findDiagramNode, findNodeByModelFqn, typedSystem } from './utils'

type Any = t.aux.Any
type Unknown = t.aux.UnknownLayouted
type ViewId<A> = t.aux.ViewId<A>
type Fqn<A> = t.aux.Fqn<A>
type NodeId = t.aux.NodeId
type EdgeId = t.aux.EdgeId

export class DiagramApi<A extends Any = Unknown> {
  private static cache = new DefaultWeakMap((ref: RefObject<DiagramActorRef>) => new DiagramApi(ref))

  public static withActor(actorRef: RefObject<DiagramActorRef>): DiagramApi {
    return this.cache.get(actorRef)
  }

  /**
   * React ref to the diagram actor
   */
  readonly ref: RefObject<DiagramActorRef>

  private constructor(actorRef: RefObject<DiagramActorRef>) {
    this.ref = actorRef
  }

  /**
   * @warning Do not use in render phase
   */
  get actor(): DiagramActorRef {
    return this.ref.current
  }

  /**
   * @warning Do not use in render phase
   */
  get currentView(): t.DiagramView<A> {
    return this.ref.current.getSnapshot().context.view
  }

  /**
   * Editor actor reference
   * @warning Do not use in render phase
   */
  editorActor(): EditorActorRef {
    const editorActor = typedSystem(this.ref.current.system).editorActorRef
    return nonNullable(editorActor, 'Editor actor not found in actor system')
  }

  /**
   * Overlays actor reference
   * @warning Do not use in render phase
   */
  overlays(): OverlaysActorRef {
    const overlaysActor = typedSystem(this.ref.current.system).overlaysActorRef
    return nonNullable(overlaysActor, 'Overlays actor not found in actor system')
  }

  /**
   * Search actor reference
   * @warning Do not use in render phase
   */
  searchActor(): SearchActorRef {
    const searchActor = typedSystem(this.ref.current.system).searchActorRef
    return nonNullable(searchActor, 'Search actor not found in actor system')
  }

  /**
   * Send event to diagram actor
   */
  send(event: DiagramEvents): void {
    this.ref.current.send(event)
  }

  /**
   * Navigate to view
   * @param viewId - Target view ID
   * @param fromNode - Node from which navigation was triggered
   * @param focusOnElement - Element FQN to focus after navigation (from search)
   */
  navigateTo(viewId: ViewId<A>, fromNode?: NodeId, focusOnElement?: Fqn<A>): void {
    this.send({
      type: 'navigate.to',
      viewId: viewId as any,
      ...(fromNode && { fromNode }),
      ...(focusOnElement && { focusOnElement: focusOnElement as any }),
    })
  }

  /**
   * Navigate back or forward in history
   */
  navigate(direction: 'back' | 'forward'): void {
    this.send({ type: `navigate.${direction}` })
  }

  /**
   * Fit diagram to view
   */
  fitDiagram(duration = 350): void {
    this.send({ type: 'xyflow.fitDiagram', duration })
  }

  /**
   * Open relationships browser
   */
  openRelationshipsBrowser(fqn: Fqn<A>): void {
    this.send({ type: 'open.relationshipsBrowser', fqn })
  }

  /**
   * If running in editor, trigger opening source file
   */
  openSource(params: OpenSourceParams<Unknown>): void {
    this.send({ type: 'open.source', ...params })
  }

  /**
   * Open element details card
   */
  openElementDetails(fqn: Fqn<A>, fromNode?: NodeId): void {
    this.send({ type: 'open.elementDetails', fqn, fromNode })
  }

  openRelationshipDetails(...params: [edgeId: EdgeId] | [source: Fqn<A>, target: Fqn<A>]): void {
    if (params.length === 1) {
      this.send({ type: 'open.relationshipDetails', params: { edgeId: params[0] } })
    } else {
      this.send({ type: 'open.relationshipDetails', params: { source: params[0], target: params[1] } })
    }
  }

  updateNodeData(nodeId: NodeId, data: PartialDeep<Types.NodeData>): void {
    this.send({ type: 'update.nodeData', nodeId, data })
  }

  updateEdgeData(edgeId: EdgeId, data: PartialDeep<Types.EdgeData>): void {
    this.send({ type: 'update.edgeData', edgeId, data })
  }

  highlightNode(nodeId: NodeId): void {
    this.send({ type: 'highlight.node', nodeId })
  }

  highlightEdge(edgeId: EdgeId): void {
    this.send({ type: 'highlight.edge', edgeId })
  }

  unhighlightAll(): void {
    this.send({ type: 'unhighlight.all' })
  }

  /**
   * Center viewport on a given node
   */
  centerViewportOnNode(target: NodeId): void {
    this.send({ type: 'xyflow.centerViewport', nodeId: target })
  }

  /**
   * Center viewport on a given edge (centering on edge means including both source and target nodes in view)
   */
  centerViewportOnEdge(target: EdgeId): void {
    this.send({ type: 'xyflow.centerViewport', edgeId: target })
  }

  /**
   * Start editing, either node or edge
   */
  startEditing(subject: 'node' | 'edge'): void {
    const editorActor = typedSystem(this.ref.current.system).editorActorRef
    invariant(editorActor, 'No editor actor found in diagram actor system')
    editorActor.send({ type: 'edit.move.start', subject })
  }

  /**
   * Stop editing
   * @param wasChanged - whether there were changes made during editing
   * @default false
   */
  stopEditing(wasChanged = false): void {
    const editorActor = typedSystem(this.ref.current.system).editorActorRef
    invariant(editorActor, 'No editor actor found in diagram actor system')
    editorActor.send({ type: wasChanged ? 'edit.move.end' : 'edit.move.cancel' })
  }

  /**
   * Undo last editing operation
   * @returns true if there was something to undo
   */
  undoEditing(): boolean {
    const editorActor = typedSystem(this.ref.current.system).editorActorRef
    invariant(editorActor, 'No editor actor found in diagram actor system')
    const hasUndo = editorActor.getSnapshot().context.history !== null
    if (hasUndo) {
      editorActor.send({ type: 'undo' })
    }
    return hasUndo
  }

  /**
   * Align nodes
   */
  align(mode: AlignmentMode): void {
    this.send({ type: 'layout.align', mode })
  }

  /**
   * Reset edge control points
   */
  resetEdgeControlPoints(): void {
    this.send({ type: 'layout.resetEdgeControlPoints' })
  }

  /**
   * Focus node
   */
  focusNode(nodeId: NodeId): void {
    this.send({ type: 'focus.node', nodeId })
  }

  /**
   * Focus on element by FQN (finds the node and focuses on it).
   * Used by search to highlight an element on the current view.
   */
  focusOnElement(elementFqn: Fqn<A>): void {
    const context = this.ref.current.getSnapshot().context
    const node = findNodeByModelFqn(context.xynodes, elementFqn)
    if (node) {
      this.send({ type: 'focus.node', nodeId: node.id as NodeId, autoUnfocus: true })
    }
  }

  /**
   * @warning Do not use in render phase
   */
  getContext(): DiagramContext {
    return this.ref.current.getSnapshot().context
  }

  /**
   * @warning Do not use in render phase
   */
  findDiagramNode(xynodeId: string): t.DiagramNode<A> | null {
    return findDiagramNode(this.ref.current.getSnapshot().context, xynodeId)
  }

  /**
   * @warning Do not use in render phase
   */
  findEdge(xyedgeId: string): Types.Edge | null {
    return this.ref.current.getSnapshot().context.xyedges.find(e => e.data.id === xyedgeId) ?? null
  }

  /**
   * @warning Do not use in render phase
   */
  findDiagramEdge(xyedgeId: string): t.DiagramEdge<A> | null {
    return findDiagramEdge(this.ref.current.getSnapshot().context, xyedgeId)
  }

  startWalkthrough(): void {
    this.send({ type: 'walkthrough.start' })
  }

  walkthroughStep(value: 'next' | 'previous' | { step: t.StepPath } = 'next'): void {
    if (value === 'next' || value === 'previous') {
      this.send({ type: 'walkthrough.step', direction: value })
    } else {
      this.send({ type: 'walkthrough.step', stepId: value.step })
    }
  }

  stopWalkthrough(): void {
    this.send({ type: 'walkthrough.end' })
  }

  toggleFeature(feature: TogglableFeature, forceValue?: boolean): void {
    this.send({ type: 'toggle.feature', feature, ...(forceValue !== undefined && { forceValue }) })
  }

  highlightNotation(notation: ElementNotation, kind?: string): void {
    this.send({ type: 'notations.highlight', notation, ...(kind && { kind }) })
  }

  unhighlightNotation(): void {
    this.send({ type: 'notations.unhighlight' })
  }

  openSearch(searchValue?: string): void {
    this.send({ type: 'open.search', ...(searchValue && { search: searchValue }) })
  }

  triggerChange(change: ViewChange): void {
    this.send({ type: 'trigger.change', change })
  }

  /**
   * Switch dynamic view display variant
   */
  switchDynamicViewVariant(variant: DynamicViewDisplayVariant): void {
    this.send({ type: 'switch.dynamicViewVariant', variant })
  }

  /**
   * Toggle sequence flow collapse/expand
   */
  toggleSequenceFlow(flowId: t.StepPath): void {
    this.send({ type: 'sequence.flow.toggle', flowId })
  }
}
