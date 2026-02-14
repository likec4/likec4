import type { LikeC4Styles } from '../styles/LikeC4Styles';
import { type Any, type IteratorLike, type LikeC4Project, type Specification, FqnRef } from '../types';
import * as aux from '../types/_aux';
import { type DeployedInstancesIterator, type DeploymentElementModel, type DeploymentElementsIterator, type DeploymentNodesIterator, DeployedInstanceModel, DeploymentNodeModel, DeploymentRelationModel, NestedElementOfDeployedInstanceModel } from './DeploymentElementModel';
import type { LikeC4Model } from './LikeC4Model';
import type { $ModelData, DeploymentOrFqn, ElementOrFqn, IncomingFilter, OutgoingFilter, RelationOrId } from './types';
import type { LikeC4ViewModel } from './view/LikeC4ViewModel';
export declare class LikeC4DeploymentModel<A extends Any = Any> {
    #private;
    readonly $model: LikeC4Model<A>;
    readonly $deployments: $ModelData<A>['deployments'];
    constructor($model: LikeC4Model<A>);
    /**
     * Returns the styles configuration for the project.
     */
    get $styles(): LikeC4Styles;
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
    element(el: DeploymentOrFqn<A>): DeploymentElementModel<A>;
    findElement(el: aux.LooseDeploymentId<A>): DeploymentElementModel<A> | null;
    node(el: DeploymentOrFqn<A>): DeploymentNodeModel<A>;
    findNode(el: aux.LooseDeploymentId<A>): DeploymentNodeModel<A> | null;
    instance(el: DeploymentOrFqn<A>): DeployedInstanceModel<A>;
    findInstance(el: aux.LooseDeploymentId<A>): DeployedInstanceModel<A> | null;
    /**
     * Returns the root elements of the model.
     */
    roots(): DeploymentNodesIterator<A>;
    /**
     * Returns all elements in the model.
     */
    elements(): DeploymentElementsIterator<A>;
    /**
     * Returns all elements in the model.
     */
    nodes(): DeploymentNodesIterator<A>;
    nodesOfKind(kind: aux.DeploymentKind<A>): DeploymentNodesIterator<A>;
    instances(): DeployedInstancesIterator<A>;
    /**
     * Iterate over all instances of the given logical element.
     */
    instancesOf(element: ElementOrFqn<A>): DeployedInstancesIterator<A>;
    deploymentRef(ref: FqnRef.DeploymentRef<A>): DeploymentElementModel<A> | NestedElementOfDeployedInstanceModel<A>;
    /**
     * Returns all relationships in the model.
     */
    relationships(): IteratorLike<DeploymentRelationModel<A>>;
    /**
     * Returns a specific relationship by its ID.
     */
    relationship(id: RelationOrId): DeploymentRelationModel<A>;
    findRelationship(id: string): DeploymentRelationModel<A> | null;
    /**
     * Returns all deployment views in the model.
     */
    views(): IteratorLike<LikeC4ViewModel.DeploymentView<A>>;
    /**
     * Returns the parent element of given element.
     * @see ancestors
     */
    parent(element: DeploymentOrFqn<A>): DeploymentNodeModel<A> | null;
    /**
     * Get all children of the element (only direct children),
     * @see descendants
     */
    children(element: DeploymentOrFqn<A>): ReadonlySet<DeploymentElementModel<A>>;
    /**
     * Get all sibling (i.e. same parent)
     */
    siblings(element: DeploymentOrFqn<A>): DeploymentElementsIterator<A>;
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    ancestors(element: DeploymentOrFqn<A>): DeploymentNodesIterator<A>;
    /**
     * Get all descendant elements (i.e. children, children’s children, etc.)
     */
    descendants(element: DeploymentOrFqn<A>, sort?: 'asc' | 'desc'): DeploymentElementsIterator<A>;
    /**
     * Incoming relationships to the element and its descendants
     * @see incomers
     */
    incoming(element: DeploymentOrFqn<A>, filter?: IncomingFilter): IteratorLike<DeploymentRelationModel<A>>;
    /**
     * Outgoing relationships from the element and its descendants
     * @see outgoers
     */
    outgoing(element: DeploymentOrFqn<A>, filter?: OutgoingFilter): IteratorLike<DeploymentRelationModel<A>>;
    private addElement;
    private addRelation;
}
