import type { IsAny } from 'type-fest';
import { LikeC4Styles } from '../styles/LikeC4Styles';
import type { Any, Aux, AuxFromDump, ComputedLikeC4ModelData, IteratorLike, LayoutedLikeC4ModelData, LikeC4ModelDump, LikeC4Project, ModelGlobals, ParsedLikeC4ModelData, Specification, ViewManualLayoutSnapshot, WhereOperator } from '../types';
import type * as aux from '../types/_aux';
import type { AnyComputed, AnyLayouted, AnyParsed, Unknown, UnknownComputed, UnknownLayouted, UnknownParsed } from '../types/_aux';
import * as scalar from '../types/scalar';
import type { DeployedInstanceModel, DeploymentNodeModel, DeploymentRelationModel } from './DeploymentElementModel';
import { LikeC4DeploymentModel } from './DeploymentModel';
import { type ElementsIterator, ElementModel } from './ElementModel';
import { type RelationshipsIterator, RelationshipModel } from './RelationModel';
import type { $ModelData, $View, $ViewModel, ElementOrFqn, IncomingFilter, OutgoingFilter, RelationOrId } from './types';
import { LikeC4ViewModel } from './view/LikeC4ViewModel';
import { LikeC4ViewsFolder } from './view/LikeC4ViewsFolder';
import type { NodeModel } from './view/NodeModel';
export declare class LikeC4Model<A extends Any = Any> {
    /**
     * Don't use in runtime, only for type inference
     */
    readonly Aux: A;
    protected readonly _elements: Map<aux.Fqn<A>, ElementModel<A>>;
    protected readonly _parents: Map<aux.Fqn<A>, ElementModel<A>>;
    protected readonly _children: any;
    protected readonly _rootElements: Set<ElementModel<A>>;
    protected readonly _relations: Map<Tagged<Id, "RelationId">, RelationshipModel<A>>;
    protected readonly _incoming: any;
    protected readonly _outgoing: any;
    protected readonly _internal: any;
    protected readonly _views: Map<aux.ViewId<A>, LikeC4ViewModel<A, $View<A>>>;
    protected readonly _rootViewFolder: LikeC4ViewsFolder<A>;
    protected readonly _viewFolders: Map<string, LikeC4ViewsFolder<A>>;
    protected readonly _viewFolderItems: any;
    protected readonly _allTags: any;
    static fromParsed<T extends AnyParsed>(model: ParsedLikeC4ModelData<T>): LikeC4Model<T>;
    /**
     * Creates a new LikeC4Model instance from the provided model data.
     * Model with parsed data will not have views, as they must be computed
     * (this model is used for computing views)
     *
     * @typeParam M - Type parameter constrained to AnyLikeC4Model
     * @param model - The model data to create a LikeC4Model from
     * @returns A new LikeC4Model instance with the type derived from the input model
     */
    static create<T extends AnyParsed>(model: ParsedLikeC4ModelData<T>): LikeC4Model<T>;
    static create<T extends AnyComputed>(model: ComputedLikeC4ModelData<T>): LikeC4Model<T>;
    static create<T extends AnyLayouted>(model: LayoutedLikeC4ModelData<T>): LikeC4Model<T>;
    static create<T extends Any>(model: $ModelData<T>): LikeC4Model<T>;
    /**
     * Creates a new LikeC4Model instance and infers types from a model dump.\
     * Model dump expected to be computed or layouted.
     *
     * @typeParam D - A constant type parameter extending LikeC4ModelDump
     * @param dump - The model dump to create the instance from
     * @returns A  new LikeC4Model instance with types inferred from the dump
     */
    static fromDump<const D extends LikeC4ModelDump>(dump: D): LikeC4Model<AuxFromDump<D>>;
    readonly deployment: LikeC4DeploymentModel<A>;
    readonly $data: $ModelData<A>;
    constructor($data: $ModelData<A>);
    /**
     * Type narrows the model to the parsed stage.
     * This is useful for tests
     */
    get asParsed(): LikeC4Model.Parsed<A>;
    /**
     * Type narrows the model to the layouted stage.
     * This is useful for tests
     */
    get asComputed(): LikeC4Model.Computed<A>;
    /**
     * Type narrows the model to the layouted stage.
     * This is useful for tests
     */
    get asLayouted(): LikeC4Model.Layouted<A>;
    /**
     * Returns the styles configuration for the project.
     */
    get $styles(): LikeC4Styles;
    /**
     * Type guard the model to the parsed stage.
     */
    isParsed(this: LikeC4Model<any>): this is LikeC4Model.Parsed<A>;
    /**
     * Type guard the model to the layouted stage.
     */
    isLayouted(this: LikeC4Model<any>): this is LikeC4Model.Layouted<A>;
    /**
     * Type guard the model to the computed stage.
     */
    isComputed(this: LikeC4Model<any>): this is LikeC4Model.Computed<A>;
    /**
     * Keeping here for backward compatibility
     * @deprecated use {@link $data}
     */
    get $model(): $ModelData<A>;
    get stage(): aux.Stage<A>;
    /**
     * Returns the Project ID associated with the model.
     * If the project ID is not defined in the model, it returns "default".
     */
    get projectId(): aux.ProjectId<A>;
    /**
     * Returns the project associated with the model.
     * If the project is not defined in the model, it returns a default project with the ID "default".
     */
    get project(): LikeC4Project;
    get specification(): Specification<A>;
    get globals(): ModelGlobals<A>;
    /**
     * Returns the element with the given FQN.
     *
     * @throws Error if element is not found\
     * Use {@link findElement} if you don't want to throw an error
     *
     * @note Method is type-safe for typed model
  
     * @example
     * model.element('cloud.frontend')
     * // or object with id property of scalar.Fqn
     * model.element({
     *   id: 'dashboard',
     * })
     */
    element(el: aux.ElementId<A> | {
        id: aux.Fqn<A>;
    }): ElementModel<A>;
    /**
     * Returns the element with the given FQN.
     *
     * @returns Element if found, null otherwise
     * @note Method is not type-safe as {@link element}
     *
     * @example
     * model.findElement('cloud.frontend')
     */
    findElement(el: aux.LooseElementId<A>): ElementModel<A> | null;
    /**
     * Returns the root elements of the model.
     */
    roots(): ElementsIterator<A>;
    /**
     * Returns all elements in the model.
     */
    elements(): ElementsIterator<A>;
    /**
     * Returns all relationships in the model.
     */
    relationships(): RelationshipsIterator<A>;
    /**
     * Returns a specific relationship by its ID.
     * If the relationship is not found in the model, it will be searched in the deployment model.
     * Search can be limited to the model or deployment model only.
     */
    relationship(rel: RelationOrId, type: 'model'): RelationshipModel<A>;
    relationship(rel: RelationOrId, type: 'deployment'): DeploymentRelationModel<A>;
    relationship(rel: scalar.RelationId, type?: 'model' | 'deployment'): RelationshipModel<A> | DeploymentRelationModel<A>;
    findRelationship(id: string, type: 'model'): RelationshipModel<A> | null;
    findRelationship(id: string, type: 'deployment'): DeploymentRelationModel<A> | null;
    findRelationship(id: string, type?: 'model' | 'deployment'): RelationshipModel<A> | DeploymentRelationModel<A> | null;
    /**
     * Returns all views in the model.
     */
    views(): IteratorLike<LikeC4ViewModel<A, $View<A>>>;
    /**
     * Returns a specific view by its ID.
     * @note Method is type-safe for typed model
     * @throws Error if view is not found\
     * Use {@link findView} if you don't want to throw an error
     *
     * @example
     * model.view('index')
     * // or object with id property of scalar.ViewId
     * model.view({
     *   id: 'index',
     * })
     */
    view(viewId: aux.ViewId<A> | {
        id: scalar.ViewId<aux.ViewId<A>>;
    }): $ViewModel<A>;
    /**
     * Returns a specific view by its ID.
     * @note Method is not type-safe as {@link view}
     *
     * @example
     * model.findView('index')
     */
    findView(viewId: aux.LooseViewId<A>): $ViewModel<A> | null;
    /**
     * Returns manual layout snapshot for given view ID, if any.
     */
    findManualLayout(viewId: aux.LooseViewId<A>): ViewManualLayoutSnapshot | null;
    /**
     * Returns a view folder by its path.
     * Path is extracted from the view title, e.g. "Group 1/Group 2/View" -> "Group 1/Group 2"
     * @throws Error if view folder is not found.
     */
    viewFolder(path: string): LikeC4ViewsFolder<A>;
    /**
     * Root folder is a special one with an empty path and used only for internal purposes.
     * It is not visible to the user and should be used only to get top-level folders and views.
     */
    get rootViewFolder(): LikeC4ViewsFolder<A>;
    /**
     * Whether the model has any view folders.
     */
    get hasViewFolders(): boolean;
    /**
     * Returns all children of a view folder.
     * Path is extracted from the view title, e.g. "Group 1/Group 2/View" -> "Group 1/Group 2"
     *
     * @throws Error if view folder is not found.
     */
    viewFolderItems(path: string): ReadonlySet<LikeC4ViewsFolder<A> | LikeC4ViewModel<A>>;
    /**
     * Returns the parent element of given element.
     * @see ancestors
     */
    parent(element: ElementOrFqn<A>): ElementModel<A> | null;
    /**
     * Get all children of the element (only direct children),
     * @see descendants
     */
    children(element: ElementOrFqn<A>): ReadonlySet<ElementModel<A>>;
    /**
     * Get all sibling (i.e. same parent)
     */
    siblings(element: ElementOrFqn<A>): ElementsIterator<A>;
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    ancestors(element: ElementOrFqn<A>): ElementsIterator<A>;
    /**
     * Get all descendant elements (i.e. children, children’s children, etc.)
     */
    descendants(element: ElementOrFqn<A>): ElementsIterator<A>;
    /**
     * Incoming relationships to the element and its descendants
     * @see incomers
     */
    incoming(element: ElementOrFqn<A>, filter?: IncomingFilter): RelationshipsIterator<A>;
    /**
     * Outgoing relationships from the element and its descendants
     * @see outgoers
     */
    outgoing(element: ElementOrFqn<A>, filter?: OutgoingFilter): RelationshipsIterator<A>;
    /**
     * Returns array of all tags used in the model, sorted naturally.\
     * Use {@link specification.tags} to get all defined tags
     */
    get tags(): aux.Tags<A>;
    /**
     * Returns all tags used in the model, sorted by usage count (descending).
     */
    get tagsSortedByUsage(): ReadonlyArray<{
        tag: aux.Tag<A>;
        count: number;
        tagged: ReadonlySet<ElementModel<A> | RelationshipModel<A> | LikeC4ViewModel<A>>;
    }>;
    /**
     * Returns all elements, relationships and views marked with the given tag.
     */
    findByTag(tag: aux.Tag<A>): IteratorLike<ElementModel<A> | RelationshipModel<A> | LikeC4ViewModel<A>>;
    findByTag(tag: aux.Tag<A>, type: 'elements'): IteratorLike<ElementModel<A>>;
    findByTag(tag: aux.Tag<A>, type: 'views'): IteratorLike<LikeC4ViewModel<A>>;
    findByTag(tag: aux.Tag<A>, type: 'relationships'): IteratorLike<RelationshipModel<A>>;
    /**
     * Returns all elements of the given kind.
     */
    elementsOfKind(kind: aux.ElementKind<A>): IteratorLike<ElementModel<A>>;
    /**
     * Returns all elements that match the given where operator.
     *
     * @example
     * ```ts
     * model.where({
     *   and: [
     *     { kind: 'component' },
     *     {
     *       or: [
     *         { tag: 'old' },
     *         { tag: { neq: 'new' } },
     *       ],
     *     },
     *   ],
     * })
     * ```
     */
    elementsWhere(where: WhereOperator<A>): IteratorLike<ElementModel<A>>;
    /**
     * Returns all **model** relationships that match the given where operator.
     *
     * @example
     * ```ts
     * model.relationshipsWhere({
     *   and: [
     *     { kind: 'uses' },
     *     {
     *       or: [
     *         { tag: 'old' },
     *         { tag: { neq: 'new' } },
     *       ],
     *     },
     *   ],
     * })
     * ```
     */
    relationshipsWhere(where: WhereOperator<A>): IteratorLike<RelationshipModel<A>>;
    private addElement;
    private addImportedElement;
    private addRelation;
}
/**
 *  When you do not need types in the model
 */
export type AnyLikeC4Model = LikeC4Model<any>;
export declare namespace LikeC4Model {
    const EMPTY: LikeC4Model<Unknown>;
    type Parsed<A = unknown> = IsAny<A> extends true ? LikeC4Model<AnyParsed> : A extends Aux<any, infer E, infer D, infer V, infer PID, infer Spec> ? LikeC4Model<Aux<'parsed', E, D, V, PID, Spec>> : LikeC4Model<UnknownParsed>;
    type Computed<A = unknown> = IsAny<A> extends true ? LikeC4Model<AnyComputed> : A extends Aux<any, infer E, infer D, infer V, infer PID, infer Spec> ? LikeC4Model<Aux<'computed', E, D, V, PID, Spec>> : LikeC4Model<UnknownComputed>;
    type Layouted<A = unknown> = IsAny<A> extends true ? LikeC4Model<AnyLayouted> : A extends Aux<any, infer E, infer D, infer V, infer PID, infer Spec> ? LikeC4Model<Aux<'layouted', E, D, V, PID, Spec>> : LikeC4Model<UnknownLayouted>;
    type Node<A = Any> = A extends Any ? NodeModel<A> : never;
    type Element<A = Any> = A extends Any ? ElementModel<A> : never;
    type Relationship<A = Any> = A extends Any ? RelationshipModel<A> : never;
    type View<A = Any> = A extends Any ? $ViewModel<A> : never;
    type DeploymentNode<A = Any> = A extends Any ? DeploymentNodeModel<A> : never;
    type DeploymentRelation<A = Any> = A extends Any ? DeploymentRelationModel<A> : never;
    type DeployedInstance<A = Any> = A extends Any ? DeployedInstanceModel<A> : never;
    type AnyRelation<M = Any> = M extends Any ? RelationshipModel<M> | DeploymentRelationModel<M> : never;
}
