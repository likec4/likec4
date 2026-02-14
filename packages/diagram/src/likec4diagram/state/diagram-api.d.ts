import type * as t from '@likec4/core/types';
import type { DynamicViewDisplayVariant, NodeNotation as ElementNotation, ViewChange } from '@likec4/core/types';
import type { RefObject } from 'react';
import type { PartialDeep } from 'type-fest';
import type { FeatureName } from '../../context/DiagramFeatures';
import type { OpenSourceParams } from '../../LikeC4Diagram.props';
import type { OverlaysActorRef } from '../../overlays/overlaysActor';
import type { Types } from '../types';
import type { AlignmentMode } from './aligners';
import type { DiagramActorRef, DiagramContext, DiagramEvents } from './types';
type Any = t.aux.Any;
type Unknown = t.aux.UnknownLayouted;
type ViewId<A> = t.aux.ViewId<A>;
type Fqn<A> = t.aux.Fqn<A>;
type NodeId = t.aux.NodeId;
type EdgeId = t.aux.EdgeId;
export interface DiagramApi<A extends Any = Unknown> {
    /**
     * React ref to the diagram actor
     */
    readonly ref: RefObject<DiagramActorRef>;
    /**
     * @warning Do not use in render phase
     */
    readonly actor: DiagramActorRef;
    /**
     * @warning Do not use in render phase
     */
    readonly currentView: t.DiagramView<A>;
    overlays(): OverlaysActorRef;
    /**
     * Send event to diagram actor
     */
    send(event: DiagramEvents): void;
    /**
     * Navigate to view
     * @param viewId - Target view ID
     * @param fromNode - Node from which navigation was triggered
     * @param focusOnElement - Element FQN to focus after navigation (from search)
     */
    navigateTo(viewId: ViewId<A>, fromNode?: NodeId, focusOnElement?: Fqn<A>): void;
    /**
     * Navigate back or forward in history
     */
    navigate(direction: 'back' | 'forward'): void;
    /**
     * Fit diagram to view
     */
    fitDiagram(duration?: number): void;
    /**
     * Open relationships browser
     */
    openRelationshipsBrowser(fqn: Fqn<A>): void;
    /**
     * If running in editor, trigger opening source file
     */
    openSource(params: OpenSourceParams<A>): void;
    /**
     * Open element details card
     */
    openElementDetails(fqn: Fqn<A>, fromNode?: NodeId): void;
    openRelationshipDetails(...params: [edgeId: EdgeId] | [source: Fqn<A>, target: Fqn<A>]): void;
    updateNodeData(nodeId: NodeId, data: PartialDeep<Types.NodeData>): void;
    updateEdgeData(edgeId: EdgeId, data: PartialDeep<Types.EdgeData>): void;
    highlightNode(nodeId: NodeId): void;
    highlightEdge(edgeId: EdgeId): void;
    unhighlightAll(): void;
    /**
     * Center viewport on a given node
     */
    centerViewportOnNode(target: NodeId): void;
    /**
     * Center viewport on a given edge (centering on edge means including both source and target nodes in view)
     */
    centerViewportOnEdge(target: EdgeId): void;
    /**
     * Start editing, either node or edge
     */
    startEditing(subject: 'node' | 'edge'): void;
    /**
     * Stop editing
     * @param wasChanged - whether there were changes made during editing
     * @default false
     */
    stopEditing(wasChanged?: boolean): void;
    /**
     * Undo last editing operation
     * @returns true if there was something to undo
     */
    undoEditing(): boolean;
    /**
     * Align nodes
     */
    align(mode: AlignmentMode): void;
    /**
     * Reset edge control points
     */
    resetEdgeControlPoints(): void;
    /**
     * Focus node
     */
    focusNode(nodeId: NodeId): void;
    /**
     * Focus on element by FQN (finds the node and focuses on it).
     * Used by search to highlight an element on the current view.
     */
    focusOnElement(elementFqn: Fqn<A>): void;
    /**
     * @warning Do not use in render phase
     */
    getContext(): DiagramContext;
    /**
     * @warning Do not use in render phase
     */
    findDiagramNode(xynodeId: string): t.DiagramNode<A> | null;
    /**
     * @warning Do not use in render phase
     */
    findEdge(xyedgeId: string): Types.Edge | null;
    /**
     * @warning Do not use in render phase
     */
    findDiagramEdge(xyedgeId: string): t.DiagramEdge<A> | null;
    startWalkthrough(): void;
    walkthroughStep(direction?: 'next' | 'previous'): void;
    stopWalkthrough(): void;
    toggleFeature(feature: FeatureName, forceValue?: boolean): void;
    highlightNotation(notation: ElementNotation, kind?: string): void;
    unhighlightNotation(): void;
    openSearch(searchValue?: string): void;
    triggerChange(viewChange: ViewChange): void;
    /**
     * Switch dynamic view display variant
     */
    switchDynamicViewVariant(variant: DynamicViewDisplayVariant): void;
}
export declare function makeDiagramApi<A extends Any = Unknown>(actorRef: RefObject<DiagramActorRef>): DiagramApi<A>;
export {};
