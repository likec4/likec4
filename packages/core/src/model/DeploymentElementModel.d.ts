import type { SetRequired } from 'type-fest';
import type { Any, Color, DeployedInstance, DeploymentElement, DeploymentNode, DeploymentRelationship, ElementShape as C4ElementShape, ElementStyle, IconUrl, IteratorLike, Link, RelationshipArrowType, RelationshipLineType, RichTextOrEmpty, scalar } from '../types';
import type * as aux from '../types/_aux';
import type { LikeC4DeploymentModel } from './DeploymentModel';
import type { ElementModel } from './ElementModel';
import type { AnyRelationshipModel, RelationshipModel, RelationshipsIterator } from './RelationModel';
import type { IncomingFilter, OutgoingFilter, WithMetadata, WithTags } from './types';
import type { LikeC4ViewModel } from './view/LikeC4ViewModel';
export type DeploymentElementsIterator<A extends Any> = IteratorLike<DeploymentElementModel<A>>;
export type DeployedInstancesIterator<A extends Any> = IteratorLike<DeployedInstanceModel<A>>;
export type DeploymentNodesIterator<A extends Any> = IteratorLike<DeploymentNodeModel<A>>;
export type DeploymentElementModel<A extends Any = Any> = DeploymentNodeModel<A> | DeployedInstanceModel<A>;
declare abstract class AbstractDeploymentElementModel<A extends Any> implements WithTags<A>, WithMetadata<A> {
    /**
     * Don't use in runtime, only for type inference
     */
    readonly Aux: A;
    abstract readonly id: aux.DeploymentFqn<A>;
    abstract readonly _literalId: aux.DeploymentId<A>;
    abstract readonly parent: DeploymentNodeModel<A> | null;
    abstract readonly title: string;
    abstract readonly hierarchyLevel: number;
    abstract readonly $model: LikeC4DeploymentModel<A>;
    abstract readonly $node: DeploymentElement<A>;
    abstract readonly tags: aux.Tags<A>;
    get style(): SetRequired<ElementStyle, 'shape' | 'color' | 'size'>;
    get name(): string;
    get shape(): C4ElementShape;
    get color(): Color;
    get icon(): IconUrl | null;
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
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    ancestors(): DeploymentNodesIterator<A>;
    /**
     * Returns the common ancestor of this element and another element.
     */
    commonAncestor(another: DeploymentElementModel<A>): DeploymentNodeModel<A> | null;
    /**
     * Get all sibling (i.e. same parent)
     */
    siblings(): DeploymentElementsIterator<A>;
    /**
     * Check if the element is a sibling of another element
     */
    isSibling(other: DeploymentElementModel<A>): boolean;
    /**
     * Resolve siblings of the element and its ancestors
     *  (from closest to root)
     */
    ascendingSiblings(): DeploymentElementsIterator<A>;
    /**
     * Resolve siblings of the element and its ancestors
     *  (from root to closest)
     */
    descendingSiblings(): DeploymentElementsIterator<A>;
    incoming(filter?: IncomingFilter): IteratorLike<DeploymentRelationModel<A>>;
    outgoing(filter?: OutgoingFilter): IteratorLike<DeploymentRelationModel<A>>;
    incomers(filter?: IncomingFilter): IteratorLike<DeploymentRelationEndpoint<A>>;
    outgoers(filter?: OutgoingFilter): IteratorLike<DeploymentRelationEndpoint<A>>;
    /**
     * Iterate over all views that include this deployment element.
     */
    views(): IteratorLike<LikeC4ViewModel.DeploymentView<A>>;
    isDeploymentNode(): this is DeploymentNodeModel<A>;
    isInstance(): this is DeployedInstanceModel<A>;
    abstract outgoingModelRelationships(): RelationshipsIterator<A>;
    abstract incomingModelRelationships(): RelationshipsIterator<A>;
    get allOutgoing(): RelationshipsAccum<A>;
    get allIncoming(): RelationshipsAccum<A>;
    hasMetadata(): boolean;
    getMetadata(): aux.Metadata<A>;
    getMetadata(field: aux.MetadataKey<A>): string | string[] | undefined;
    /**
     * Checks if the deployment element has the given tag.
     */
    isTagged(tag: aux.LooseTag<A>): boolean;
}
export declare class DeploymentNodeModel<A extends Any = Any> extends AbstractDeploymentElementModel<A> {
    readonly $model: LikeC4DeploymentModel<A>;
    readonly $node: DeploymentNode<A>;
    id: aux.DeploymentFqn<A>;
    _literalId: aux.DeploymentId<A>;
    title: string;
    hierarchyLevel: number;
    constructor($model: LikeC4DeploymentModel<A>, $node: DeploymentNode<A>);
    get parent(): DeploymentNodeModel<A> | null;
    get kind(): aux.DeploymentKind<A>;
    get tags(): aux.Tags<A>;
    children(): ReadonlySet<DeploymentElementModel<A>>;
    descendants(sort?: 'asc' | 'desc'): DeploymentElementsIterator<A>;
    isDeploymentNode(): this is DeploymentNodeModel<A>;
    /**
     * Iterate over all instances nested in this deployment node.
     */
    instances(): DeployedInstancesIterator<A>;
    /**
     * Returns deployed instance inside this deployment node
     * if only there are no more instances
     */
    onlyOneInstance(): DeployedInstanceModel<A> | null;
    /**
     * Cached result of relationships from instances
     */
    private _relationshipsFromInstances;
    private relationshipsFromInstances;
    /**
     * We return only relationships that are not already present in nested instances
     */
    outgoingModelRelationships(): RelationshipsIterator<A>;
    /**
     * We return only relationships that are not already present in nested instances
     */
    incomingModelRelationships(): RelationshipsIterator<A>;
    /**
     * Returns an iterator of relationships between nested instances
     */
    internalModelRelationships(): ReadonlySet<RelationshipModel<A>>;
}
export declare class DeployedInstanceModel<A extends Any = Any> extends AbstractDeploymentElementModel<A> {
    readonly $model: LikeC4DeploymentModel<A>;
    readonly $instance: DeployedInstance<A>;
    readonly element: ElementModel<A>;
    readonly id: aux.DeploymentFqn<A>;
    readonly _literalId: aux.DeploymentId<A>;
    readonly title: string;
    readonly hierarchyLevel: number;
    constructor($model: LikeC4DeploymentModel<A>, $instance: DeployedInstance<A>, element: ElementModel<A>);
    get $node(): DeployedInstance<A>;
    get parent(): DeploymentNodeModel<A>;
    get style(): SetRequired<ElementStyle, 'shape' | 'color' | 'size'>;
    get tags(): aux.Tags<A>;
    get kind(): aux.ElementKind<A>;
    get summary(): RichTextOrEmpty;
    get description(): RichTextOrEmpty;
    get technology(): string | null;
    get links(): ReadonlyArray<Link>;
    isInstance(): this is DeployedInstanceModel<A>;
    outgoingModelRelationships(): RelationshipsIterator<A>;
    incomingModelRelationships(): RelationshipsIterator<A>;
    /**
     * Iterate over all views that include this instance.
     * (Some views may include the parent deployment node instead of the instance.)
     */
    views(): IteratorLike<LikeC4ViewModel.DeploymentView<A>>;
}
export declare class NestedElementOfDeployedInstanceModel<A extends Any = Any> {
    readonly instance: DeployedInstanceModel<A>;
    readonly element: ElementModel<A>;
    constructor(instance: DeployedInstanceModel<A>, element: ElementModel<A>);
    get id(): aux.DeploymentFqn<A>;
    get _literalId(): aux.DeploymentId<A>;
    get style(): SetRequired<ElementStyle, 'shape' | 'color'>;
    get shape(): C4ElementShape;
    get color(): Color;
    get title(): string;
    get summary(): RichTextOrEmpty;
    get description(): RichTextOrEmpty;
    get technology(): string | null;
    isDeploymentNode(): this is DeploymentNodeModel<A>;
    isInstance(): this is DeployedInstanceModel<A>;
}
export type DeploymentRelationEndpoint<A extends Any = Any> = DeploymentElementModel<A> | NestedElementOfDeployedInstanceModel<A>;
export declare class DeploymentRelationModel<A extends Any = Any> implements AnyRelationshipModel<A> {
    readonly $model: LikeC4DeploymentModel<A>;
    readonly $relationship: DeploymentRelationship<A>;
    boundary: DeploymentNodeModel<A> | null;
    source: DeploymentRelationEndpoint<A>;
    target: DeploymentRelationEndpoint<A>;
    constructor($model: LikeC4DeploymentModel<A>, $relationship: DeploymentRelationship<A>);
    get id(): scalar.RelationId;
    get expression(): string;
    get title(): string | null;
    get technology(): string | null;
    /**
     * Returns true if the relationship has a summary and a description
     * (if one is missing - it falls back to another)
     */
    get hasSummary(): boolean;
    /**
     * Short description of the relationship.
     * Falls back to description if summary is not provided.
     */
    get summary(): RichTextOrEmpty;
    /**
     * Long description of the relationship.
     * Falls back to summary if description is not provided.
     */
    get description(): RichTextOrEmpty;
    get tags(): aux.Tags<A>;
    get kind(): aux.RelationKind<A> | null;
    get navigateTo(): LikeC4ViewModel<A> | null;
    get links(): ReadonlyArray<Link>;
    get color(): Color;
    get line(): RelationshipLineType;
    get head(): RelationshipArrowType;
    get tail(): RelationshipArrowType | undefined;
    views(): IteratorLike<LikeC4ViewModel.DeploymentView<A>>;
    isDeploymentRelation(): this is DeploymentRelationModel<A>;
    isModelRelation(): this is RelationshipModel<A>;
    hasMetadata(): boolean;
    getMetadata(): aux.Metadata<A>;
    getMetadata(field: aux.MetadataKey<A>): string | string[] | undefined;
    /**
     * Checks if the relationship has the given tag.
     */
    isTagged(tag: aux.LooseTag<A>): boolean;
}
export declare class RelationshipsAccum<A extends Any = Any> {
    readonly model: ReadonlySet<RelationshipModel<A>>;
    readonly deployment: ReadonlySet<DeploymentRelationModel<A>>;
    static empty<A extends Any>(): RelationshipsAccum<A>;
    static from<A extends Any>(model: Iterable<RelationshipModel<A>> | undefined, deployment?: Iterable<DeploymentRelationModel<A>>): RelationshipsAccum<A>;
    /**
     * @param model relationships from logical model
     * @param deployment relationships from deployment model
     */
    constructor(model?: ReadonlySet<RelationshipModel<A>>, deployment?: ReadonlySet<DeploymentRelationModel<A>>);
    get isEmpty(): boolean;
    get nonEmpty(): boolean;
    get size(): number;
    /**
     * Returns new Accum containing all the elements which are both in this and otherAccum
     */
    intersect(otherAccum: RelationshipsAccum<A>): RelationshipsAccum<A>;
    /**
     * Returns new Accum containing all the elements which are both in this and otherAccum
     */
    difference(otherAccum: RelationshipsAccum<A>): RelationshipsAccum<A>;
    /**
     * Returns new Accum containing all the elements from both
     */
    union(otherAccum: RelationshipsAccum<A>): RelationshipsAccum<A>;
}
export {};
