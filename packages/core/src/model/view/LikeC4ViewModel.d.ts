import type { LikeC4Styles } from '../../styles';
import type { Any, AnyView, BBox, ComputedView, DynamicViewDisplayVariant, IteratorLike, LayoutedView, Link, scalar, ViewManualLayoutSnapshot, ViewWithType } from '../../types';
import { type RichTextOrEmpty, _stage, _type } from '../../types';
import type * as aux from '../../types/_aux';
import type { AnyComputed, AnyLayouted } from '../../types/_aux';
import type { ElementModel } from '../ElementModel';
import type { LikeC4Model } from '../LikeC4Model';
import type { $View, EdgeOrId, NodeOrId, WithTags } from '../types';
import { type EdgesIterator, EdgeModel } from './EdgeModel';
import type { LikeC4ViewsFolder } from './LikeC4ViewsFolder';
import { type NodesIterator, NodeModel } from './NodeModel';
export type ViewsIterator<A extends Any, V extends $View<A> = $View<A>> = IteratorLike<LikeC4ViewModel<A, V>>;
export type InferViewType<V> = V extends AnyView<any> ? V[_type] : never;
export declare class LikeC4ViewModel<A extends Any = Any, V extends $View<A> = $View<A>> implements WithTags<A> {
    #private;
    /**
     * Don't use in runtime, only for type inference
     */
    readonly Aux: A;
    readonly id: aux.StrictViewId<A>;
    /**
     * The model this view belongs to
     */
    readonly $model: LikeC4Model<A>;
    /**
     * The title of the view
     */
    readonly title: string | null;
    /**
     * View folder this view belongs to.
     * If view is top-level, this is the root folder.
     */
    readonly folder: LikeC4ViewsFolder<A>;
    /**
     * Path to this view, processed by {@link normalizeViewPath}
     *
     * @example
     * "Group 1/Group 2/View"
     */
    readonly viewPath: string;
    constructor(model: LikeC4Model<A>, folder: LikeC4ViewsFolder<A>, view: V, manualLayoutSnapshot?: ViewManualLayoutSnapshot | undefined);
    /**
     * Returns the styles configuration for the project.
     */
    get $styles(): LikeC4Styles;
    get _type(): V[_type];
    get stage(): V[_stage];
    get bounds(): Readonly<BBox>;
    /**
     * Returns title if defined, otherwise returns title of the element it is based on, otherwise returns its {@link id}
     */
    get titleOrId(): string;
    /**
     * Returns title if defined, otherwise returns `Untitled`.
     */
    get titleOrUntitled(): string;
    /**
     * Returns path to this view as an array of groups and this view as the last element
     * If view is top-level, returns only this view.
     *
     * @example
     * viewPath = "Group 1/Group 2/View"
     *
     * breadcrumbs = [
     *   "Group 1",             // folder
     *   "Group 1/Group 2",     // folder
     *   "Group 1/Group 2/View" // view
     * ]
     */
    get breadcrumbs(): [...LikeC4ViewsFolder<A>[], this];
    get description(): RichTextOrEmpty;
    get tags(): aux.Tags<A>;
    get links(): ReadonlyArray<Link>;
    get viewOf(): ElementModel<A> | null;
    /**
     * Available for dynamic views only
     * throws error if view is not dynamic
     */
    get mode(): DynamicViewDisplayVariant | null;
    /**
     * All tags from nodes and edges.
     */
    get includedTags(): aux.Tags<A>;
    /**
     * The original view from the model.
     * In case of layouted model, this is the latest auto-layouted view without manual changes applied
     * @see {@link $layouted} should be used for rendering in the UI
     */
    get $view(): V;
    /**
     * Returns the view with manual layout applied if it exists, otherwise returns the original view
     * This should be used for rendering in the UI
     */
    get $layouted(): V;
    get hasManualLayout(): boolean;
    get hasLayoutDrifts(): boolean;
    /**
     * If view has manual layout, returns it with manual layout applied
     */
    get $manual(): V | null;
    get projectId(): aux.ProjectId<A>;
    roots(): NodesIterator<A, V>;
    /**
     * Iterate over all nodes that have children.
     */
    compounds(): NodesIterator<A, V>;
    /**
     * Get node by id.
     * @throws Error if node is not found.
     */
    node(node: NodeOrId): NodeModel<A, V>;
    /**
     * Find node by id.
     */
    findNode(node: NodeOrId): NodeModel<A, V> | null;
    findNodeWithElement(element: aux.LooseElementId<A> | {
        id: aux.Fqn<A>;
    }): NodeModel.WithElement<A, V> | null;
    /**
     * Iterate over all nodes.
     */
    nodes(): NodesIterator<A, V>;
    /**
     * Get edge by id, throws error if edge is not found.
     * Use {@link findEdge} if you are not sure if the edge exists.
     *
     * @param edge Edge or id
     * @returns {@link EdgeModel}
     */
    edge(edge: EdgeOrId): EdgeModel<A, V>;
    /**
     * Find edge by id.
     * @param edge Edge or id
     * @returns {@link EdgeModel} or null if edge is not found
     */
    findEdge(edge: EdgeOrId): EdgeModel<A, V> | null;
    /**
     * Iterate over all edges.
     */
    edges(): EdgesIterator<A, V>;
    /**
     * Iterate over all edges.
     */
    edgesWithRelation(relation: aux.RelationId): EdgesIterator<A, V>;
    /**
     * Nodes that have references to elements from logical model.
     */
    elements(): IteratorLike<NodeModel.WithElement<A, V>>;
    /**
     * Checks if the view has the given tag.
     */
    isTagged(tag: aux.LooseTag<A>): boolean;
    includesElement(element: aux.LooseElementId<A> | {
        id: aux.Fqn<A>;
    }): boolean;
    includesDeployment(deployment: aux.LooseDeploymentId<A> | {
        id: aux.DeploymentFqn<A>;
    }): boolean;
    includesRelation(relation: scalar.RelationId | {
        id: scalar.RelationId;
    }): boolean;
    /**
     * Below are type guards.
     */
    isComputed(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel.Computed<aux.toComputed<A>>;
    isLayouted(): this is LikeC4ViewModel.Layouted<A>;
    /**
     * @deprecated Use {@link isLayouted} instead
     */
    isDiagram(): this is LikeC4ViewModel.Layouted<A>;
    isElementView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel.ElementView<A, V>;
    isScopedElementView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel.ScopedElementView<A>;
    isDeploymentView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel.DeploymentView<A, V>;
    isDynamicView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel.DynamicView<A, V>;
}
export declare namespace LikeC4ViewModel {
    type Computed<A> = A extends AnyComputed ? LikeC4ViewModel<A, ComputedView<A>> : never;
    type Layouted<A> = A extends AnyLayouted ? LikeC4ViewModel<A, LayoutedView<A>> : never;
    interface ElementView<A extends Any, V extends $View<A> = $View<A>> extends LikeC4ViewModel<A, ViewWithType<V, 'element'>> {
        readonly mode: never;
    }
    interface ScopedElementView<A extends Any> extends LikeC4ViewModel<A, ViewWithType<$View<A>, 'element'> & {
        viewOf: aux.StrictFqn<A>;
    }> {
        readonly mode: never;
        readonly viewOf: ElementModel<A>;
    }
    interface DeploymentView<A extends Any, V extends $View<A> = $View<A>> extends LikeC4ViewModel<A, ViewWithType<V, 'deployment'>> {
        readonly mode: never;
    }
    interface DynamicView<A extends Any, V extends $View<A>> extends LikeC4ViewModel<A, ViewWithType<V, 'dynamic'>> {
        readonly mode: DynamicViewDisplayVariant;
        readonly viewOf: never;
    }
}
