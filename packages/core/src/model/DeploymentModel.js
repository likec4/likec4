import { values } from 'remeda';
import { FqnRef, isDeploymentNode, } from '../types';
import { invariant, nonNullable } from '../utils';
import { ancestorsFqn, parentFqn, sortParentsFirst } from '../utils/fqn';
import { getOrCreate } from '../utils/getOrCreate';
import { DefaultMap } from '../utils/mnemonist';
import { DeployedInstanceModel, DeploymentNodeModel, DeploymentRelationModel, NestedElementOfDeployedInstanceModel, } from './DeploymentElementModel';
import { getId } from './utils';
export class LikeC4DeploymentModel {
    $model;
    #elements = new Map();
    // Parent element for given FQN
    #parents = new Map();
    // Children elements for given FQN
    #children = new DefaultMap(() => new Set());
    // Keep track of instances of the logical element
    #instancesOf = new DefaultMap(() => new Set());
    #rootElements = new Set();
    #relations = new Map();
    // Incoming to an element or its descendants
    #incoming = new DefaultMap(() => new Set());
    // Outgoing from an element or its descendants
    #outgoing = new DefaultMap(() => new Set());
    // Relationships inside the element, among descendants
    #internal = new DefaultMap(() => new Set());
    // readonly #views = new Map<ViewID, LikeC4ViewModel<A>>()
    #allTags = new DefaultMap(() => new Set());
    #nestedElementsOfDeployment = new Map();
    $deployments;
    constructor($model) {
        this.$model = $model;
        const $deployments = this.$deployments = $model.$data.deployments;
        const elements = values($deployments.elements);
        for (const element of sortParentsFirst(elements)) {
            const el = this.addElement(element);
            for (const tag of el.tags) {
                this.#allTags.get(tag).add(el);
            }
            if (el.isInstance()) {
                this.#instancesOf.get(el.element.id).add(el);
            }
        }
        for (const relation of values($deployments.relations)) {
            const el = this.addRelation(relation);
            for (const tag of el.tags) {
                this.#allTags.get(tag).add(el);
            }
        }
    }
    /**
     * Returns the styles configuration for the project.
     */
    get $styles() {
        return this.$model.$styles;
    }
    /**
     * Returns the Project ID associated with the model.
     * If the project ID is not defined in the model, it returns "default".
     */
    get projectId() {
        return this.$model.projectId;
    }
    /**
     * Returns the project associated with the model.
     * If the project is not defined in the model, it returns a default project with the ID "default".
     */
    get project() {
        return this.$model.project;
    }
    get specification() {
        return this.$model.specification;
    }
    element(el) {
        if (el instanceof DeploymentNodeModel || el instanceof DeployedInstanceModel) {
            return el;
        }
        const id = getId(el);
        return nonNullable(this.#elements.get(id), `Element ${id} not found`);
    }
    findElement(el) {
        return this.#elements.get(el) ?? null;
    }
    node(el) {
        const element = this.element(el);
        invariant(element.isDeploymentNode(), `Element ${element.id} is not a deployment node`);
        return element;
    }
    findNode(el) {
        const element = this.findElement(el);
        if (!element) {
            return null;
        }
        invariant(element.isDeploymentNode(), `Element ${element?.id} is not a deployment node`);
        return element;
    }
    instance(el) {
        const element = this.element(el);
        invariant(element.isInstance(), `Element ${element.id} is not a deployed instance`);
        return element;
    }
    findInstance(el) {
        const element = this.findElement(el);
        if (!element) {
            return null;
        }
        invariant(element.isInstance(), `Element ${element?.id} is not a deployed instance`);
        return element;
    }
    /**
     * Returns the root elements of the model.
     */
    roots() {
        return this.#rootElements.values();
    }
    /**
     * Returns all elements in the model.
     */
    elements() {
        return this.#elements.values();
    }
    /**
     * Returns all elements in the model.
     */
    *nodes() {
        for (const element of this.#elements.values()) {
            if (element.isDeploymentNode()) {
                yield element;
            }
        }
        return;
    }
    *nodesOfKind(kind) {
        for (const node of this.#elements.values()) {
            if (node.isDeploymentNode() && node.kind === kind) {
                yield node;
            }
        }
        return;
    }
    *instances() {
        for (const element of this.#elements.values()) {
            if (element.isInstance()) {
                yield element;
            }
        }
        return;
    }
    /**
     * Iterate over all instances of the given logical element.
     */
    *instancesOf(element) {
        const id = getId(element);
        const instances = this.#instancesOf.get(id);
        if (instances) {
            yield* instances;
        }
        return;
    }
    deploymentRef(ref) {
        if (FqnRef.isInsideInstanceRef(ref)) {
            const { deployment, element } = ref;
            return getOrCreate(this.#nestedElementsOfDeployment, `${deployment}@${element}`, () => {
                return new NestedElementOfDeployedInstanceModel(this.instance(deployment), this.$model.element(element));
            });
        }
        return this.element(ref.deployment);
    }
    /**
     * Returns all relationships in the model.
     */
    relationships() {
        return this.#relations.values();
    }
    /**
     * Returns a specific relationship by its ID.
     */
    relationship(id) {
        const relationId = getId(id);
        return nonNullable(this.#relations.get(relationId), `DeploymentRelationModel ${relationId} not found`);
    }
    findRelationship(id) {
        return this.#relations.get(id) ?? null;
    }
    /**
     * Returns all deployment views in the model.
     */
    *views() {
        for (const view of this.$model.views()) {
            if (view.isDeploymentView()) {
                yield view;
            }
        }
        return;
    }
    /**
     * Returns the parent element of given element.
     * @see ancestors
     */
    parent(element) {
        const id = getId(element);
        return this.#parents.get(id) || null;
    }
    /**
     * Get all children of the element (only direct children),
     * @see descendants
     */
    children(element) {
        const id = getId(element);
        return this.#children.get(id);
    }
    /**
     * Get all sibling (i.e. same parent)
     */
    *siblings(element) {
        const id = getId(element);
        const siblings = this.parent(element)?.children() ?? this.roots();
        for (const sibling of siblings) {
            if (sibling.id !== id) {
                yield sibling;
            }
        }
        return;
    }
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    *ancestors(element) {
        let id = getId(element);
        let parent;
        while ((parent = this.#parents.get(id))) {
            yield parent;
            id = parent.id;
        }
        return;
    }
    /**
     * Get all descendant elements (i.e. children, children’s children, etc.)
     */
    *descendants(element, sort = 'desc') {
        for (const child of this.children(element)) {
            if (sort === 'asc') {
                yield child;
                yield* this.descendants(child.id);
            }
            else {
                yield* this.descendants(child.id);
                yield child;
            }
        }
        return;
    }
    /**
     * Incoming relationships to the element and its descendants
     * @see incomers
     */
    *incoming(element, filter = 'all') {
        const id = getId(element);
        for (const rel of this.#incoming.get(id)) {
            switch (true) {
                case filter === 'all':
                case filter === 'direct' && rel.target.id === id:
                case filter === 'to-descendants' && rel.target.id !== id:
                    yield rel;
                    break;
            }
        }
        return;
    }
    /**
     * Outgoing relationships from the element and its descendants
     * @see outgoers
     */
    *outgoing(element, filter = 'all') {
        const id = getId(element);
        for (const rel of this.#outgoing.get(id)) {
            switch (true) {
                case filter === 'all':
                case filter === 'direct' && rel.source.id === id:
                case filter === 'from-descendants' && rel.source.id !== id:
                    yield rel;
                    break;
            }
        }
        return;
    }
    addElement(element) {
        if (this.#elements.has(element.id)) {
            throw new Error(`Element ${element.id} already exists`);
        }
        const el = isDeploymentNode(element)
            ? new DeploymentNodeModel(this, Object.freeze(element))
            : new DeployedInstanceModel(this, Object.freeze(element), this.$model.element(element.element));
        this.#elements.set(el.id, el);
        const parentId = parentFqn(el.id);
        if (parentId) {
            invariant(this.#elements.has(parentId), `Parent ${parentId} of ${el.id} not found`);
            this.#parents.set(el.id, this.node(parentId));
            this.#children.get(parentId).add(el);
        }
        else {
            invariant(el.isDeploymentNode(), `Root element ${el.id} is not a deployment node`);
            this.#rootElements.add(el);
        }
        return el;
    }
    addRelation(relation) {
        if (this.#relations.has(relation.id)) {
            throw new Error(`Relation ${relation.id} already exists`);
        }
        const rel = new DeploymentRelationModel(this, Object.freeze(relation));
        this.#relations.set(rel.id, rel);
        this.#incoming.get(rel.target.id).add(rel);
        this.#outgoing.get(rel.source.id).add(rel);
        const relParent = rel.boundary?.id ?? null;
        // Process internal relationships
        if (relParent) {
            for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
                this.#internal.get(ancestor).add(rel);
            }
        }
        // Process source hierarchy
        for (const sourceAncestor of ancestorsFqn(rel.source.id)) {
            if (sourceAncestor === relParent) {
                break;
            }
            this.#outgoing.get(sourceAncestor).add(rel);
        }
        // Process target hierarchy
        for (const targetAncestor of ancestorsFqn(rel.target.id)) {
            if (targetAncestor === relParent) {
                break;
            }
            this.#incoming.get(targetAncestor).add(rel);
        }
        return rel;
    }
}
