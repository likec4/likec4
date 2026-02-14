import type { SetRequired } from 'type-fest';
import type { Any, AnyAux, Color, Element as C4Element, ElementShape as C4ElementShape, ElementStyle, IconUrl, IteratorLike, Link, ProjectId, RichTextOrEmpty } from '../types';
import type * as aux from '../types/_aux';
import type { DeployedInstancesIterator } from './DeploymentElementModel';
import type { LikeC4Model } from './LikeC4Model';
import type { RelationshipModel, RelationshipsIterator } from './RelationModel';
import type { IncomingFilter, OutgoingFilter, WithMetadata, WithTags } from './types';
import type { LikeC4ViewModel } from './view/LikeC4ViewModel';
export type ElementsIterator<M extends AnyAux> = IteratorLike<ElementModel<M>>;
export declare class ElementModel<A extends AnyAux = Any> implements WithTags<A>, WithMetadata<A> {
    readonly $model: LikeC4Model<A>;
    readonly $element: C4Element<A>;
    /**
     * Don't use in runtime, only for type inference
     */
    readonly Aux: A;
    readonly id: aux.Fqn<A>;
    readonly _literalId: aux.ElementId<A>;
    readonly hierarchyLevel: number;
    readonly imported: null | {
        readonly from: ProjectId;
        readonly fqn: aux.Fqn<AnyAux>;
    };
    constructor($model: LikeC4Model<A>, $element: C4Element<A>);
    get name(): string;
    get parent(): ElementModel<A> | null;
    get kind(): aux.ElementKind<A>;
    get shape(): C4ElementShape;
    get color(): Color;
    get icon(): IconUrl | null;
    /**
     * Returns all tags of the element.
     * It includes tags from the element and its kind.
     */
    get tags(): aux.Tags<A>;
    get title(): string;
    /**
     * Returns true if the element has a summary and a description
     * (if one is missing - it falls back to another)
     */
    get hasSummary(): boolean;
    /**
     * Short description of the element.
     * Falls back to description if summary is not provided.
     */
    get summary(): RichTextOrEmpty;
    /**
     * Long description of the element.
     * Falls back to summary if description is not provided.
     */
    get description(): RichTextOrEmpty;
    get technology(): string | null;
    get links(): ReadonlyArray<Link>;
    get defaultView(): LikeC4ViewModel.ScopedElementView<A> | null;
    get isRoot(): boolean;
    get style(): SetRequired<ElementStyle, 'shape' | 'color' | 'size'>;
    get projectId(): aux.ProjectId<A>;
    isAncestorOf(another: ElementModel<A>): boolean;
    isDescendantOf(another: ElementModel<A>): boolean;
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    ancestors(): ElementsIterator<A>;
    /**
     * Returns the common ancestor of this element and another element.
     */
    commonAncestor(another: ElementModel<A>): ElementModel<A> | null;
    children(): ReadonlySet<ElementModel<A>>;
    /**
     * Get all descendant elements (i.e. children, children’s children, etc.)
     */
    descendants(sort?: 'asc' | 'desc'): ElementsIterator<A>;
    /**
     * Get all sibling (i.e. same parent)
     */
    siblings(): ElementsIterator<A>;
    /**
     * Resolve siblings of the element and its ancestors
     * (from closest parent to root)
     */
    ascendingSiblings(): ElementsIterator<A>;
    /**
     * Resolve siblings of the element and its ancestors
     *  (from root to closest)
     */
    descendingSiblings(): ElementsIterator<A>;
    incoming(filter?: IncomingFilter): RelationshipsIterator<A>;
    incomers(filter?: IncomingFilter): ElementsIterator<A>;
    outgoing(filter?: OutgoingFilter): RelationshipsIterator<A>;
    outgoers(filter?: OutgoingFilter): ElementsIterator<A>;
    get allOutgoing(): ReadonlySet<RelationshipModel<A>>;
    get allIncoming(): ReadonlySet<RelationshipModel<A>>;
    /**
     * Iterate over all views that include this element.
     */
    views(): ReadonlySet<LikeC4ViewModel<A>>;
    /**
     * Iterate over all views that scope this element.
     * It is possible that element is not included in the view.
     */
    scopedViews(): ReadonlySet<LikeC4ViewModel.ScopedElementView<A>>;
    /**
     * @returns true if the element is deployed
     */
    isDeployed(): boolean;
    deployments(): DeployedInstancesIterator<A>;
    hasMetadata(): boolean;
    getMetadata(): aux.Metadata<A>;
    getMetadata(field: aux.MetadataKey<A>): string | string[] | undefined;
    /**
     * Checks if the element has the given tag.
     */
    isTagged(tag: aux.LooseTag<A>): boolean;
}
