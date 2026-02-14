import { isTruthy } from 'remeda';
import { applyManualLayout, calcDriftsFromSnapshot } from '../../manual-layout';
import { _stage, _type, RichText } from '../../types';
import { DefaultMap, ifind, memoizeProp, nonNullable } from '../../utils';
import { extractViewTitleFromPath, getId, normalizeViewPath } from '../utils';
import { EdgeModel } from './EdgeModel';
import { NodeModel } from './NodeModel';
export class LikeC4ViewModel {
    /**
     * Don't use in runtime, only for type inference
     */
    Aux;
    #view;
    #rootnodes = new Set();
    #nodes = new Map();
    #edges = new Map();
    #includeElements = new Set();
    #includeDeployments = new Set();
    #includeRelations = new Set();
    #allTags = new DefaultMap((_key) => new Set());
    #manualLayoutSnapshot;
    id;
    /**
     * The model this view belongs to
     */
    $model;
    /**
     * The title of the view
     */
    title;
    /**
     * View folder this view belongs to.
     * If view is top-level, this is the root folder.
     */
    folder;
    /**
     * Path to this view, processed by {@link normalizeViewPath}
     *
     * @example
     * "Group 1/Group 2/View"
     */
    viewPath;
    constructor(model, folder, view, manualLayoutSnapshot) {
        this.$model = model;
        this.#view = view;
        this.id = view.id;
        this.folder = folder;
        this.#manualLayoutSnapshot = manualLayoutSnapshot;
        for (const node of this.#view.nodes) {
            const el = new NodeModel(this, Object.freeze(node));
            this.#nodes.set(node.id, el);
            if (!node.parent) {
                this.#rootnodes.add(el);
            }
            if (node.deploymentRef) {
                this.#includeDeployments.add(node.deploymentRef);
            }
            if (node.modelRef) {
                this.#includeElements.add(node.modelRef);
            }
            for (const tag of el.tags) {
                this.#allTags.get(tag).add(el);
            }
        }
        for (const edge of this.#view.edges) {
            const edgeModel = new EdgeModel(this, Object.freeze(edge), this.node(edge.source), this.node(edge.target));
            for (const tag of edgeModel.tags) {
                this.#allTags.get(tag).add(edgeModel);
            }
            for (const rel of edge.relations) {
                this.#includeRelations.add(rel);
            }
            this.#edges.set(edge.id, edgeModel);
        }
        this.title = view.title ? extractViewTitleFromPath(view.title) : null;
        this.viewPath = view.title ? normalizeViewPath(view.title) : view.id;
    }
    /**
     * Returns the styles configuration for the project.
     */
    get $styles() {
        return this.$model.$styles;
    }
    get _type() {
        return this.#view[_type];
    }
    get stage() {
        return this.#view[_stage];
    }
    get bounds() {
        if ('bounds' in this.#view) {
            return this.#view.bounds;
        }
        if (this.#manualLayoutSnapshot) {
            return this.#manualLayoutSnapshot.bounds;
        }
        throw new Error('View is not layouted');
    }
    /**
     * Returns title if defined, otherwise returns title of the element it is based on, otherwise returns its {@link id}
     */
    get titleOrId() {
        return this.title ?? this.viewOf?.title ?? this.id;
    }
    /**
     * Returns title if defined, otherwise returns `Untitled`.
     */
    get titleOrUntitled() {
        return this.title ?? 'Untitled';
    }
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
    get breadcrumbs() {
        return memoizeProp(this, 'breadcrumbs', () => {
            if (!this.folder.isRoot) {
                return [...this.folder.breadcrumbs, this];
            }
            return [this];
        });
    }
    get description() {
        return RichText.memoize(this, 'description', this.#view.description);
    }
    get tags() {
        return this.#view.tags ?? [];
    }
    get links() {
        return this.#view.links ?? [];
    }
    get viewOf() {
        if (this.isElementView()) {
            const viewOf = this.#view.viewOf;
            return viewOf ? this.$model.element(viewOf) : null;
        }
        return null;
    }
    /**
     * Available for dynamic views only
     * throws error if view is not dynamic
     */
    get mode() {
        if (this.isDynamicView()) {
            return this.#view.variant ?? 'diagram';
        }
        return null;
    }
    /**
     * All tags from nodes and edges.
     */
    get includedTags() {
        return [...this.#allTags.keys()];
    }
    /**
     * The original view from the model.
     * In case of layouted model, this is the latest auto-layouted view without manual changes applied
     * @see {@link $layouted} should be used for rendering in the UI
     */
    get $view() {
        if (!this.isLayouted() || 'drifts' in this.#view) {
            return this.#view;
        }
        const snapshot = this.#manualLayoutSnapshot;
        if (snapshot) {
            return memoizeProp(this, 'withDriftReasons', () => {
                return calcDriftsFromSnapshot(this.#view, snapshot);
            });
        }
        return this.#view;
    }
    /**
     * Returns the view with manual layout applied if it exists, otherwise returns the original view
     * This should be used for rendering in the UI
     */
    get $layouted() {
        if (!this.isLayouted()) {
            throw new Error('View is not layouted');
        }
        return this.$manual ?? this.#view;
    }
    get hasManualLayout() {
        return this.#manualLayoutSnapshot !== undefined;
    }
    get hasLayoutDrifts() {
        if (!this.isLayouted()) {
            return false;
        }
        const manualLayout = this.$manual;
        return !!manualLayout?.drifts && manualLayout.drifts.length > 0;
    }
    /**
     * If view has manual layout, returns it with manual layout applied
     */
    get $manual() {
        if (!this.isLayouted()) {
            return null;
        }
        const snapshot = this.#manualLayoutSnapshot;
        if (snapshot) {
            return memoizeProp(this, 'snapshotWithManualLayout', () => {
                return applyManualLayout(this.#view, snapshot);
            });
        }
        return null;
    }
    get projectId() {
        return this.$model.projectId;
    }
    roots() {
        return this.#rootnodes.values();
    }
    /**
     * Iterate over all nodes that have children.
     */
    *compounds() {
        for (const node of this.#nodes.values()) {
            if (node.hasChildren()) {
                yield node;
            }
        }
        return;
    }
    /**
     * Get node by id.
     * @throws Error if node is not found.
     */
    node(node) {
        const nodeId = getId(node);
        return nonNullable(this.#nodes.get(nodeId), `Node ${nodeId} not found in view ${this.#view.id}`);
    }
    /**
     * Find node by id.
     */
    findNode(node) {
        return this.#nodes.get(getId(node)) ?? null;
    }
    findNodeWithElement(element) {
        const id = getId(element);
        if (!this.#includeElements.has(id)) {
            return null;
        }
        return ifind(this.#nodes.values(), (node) => node.hasElement() && node.element.id === id) ?? null;
    }
    /**
     * Iterate over all nodes.
     */
    nodes() {
        return this.#nodes.values();
    }
    /**
     * Get edge by id, throws error if edge is not found.
     * Use {@link findEdge} if you are not sure if the edge exists.
     *
     * @param edge Edge or id
     * @returns {@link EdgeModel}
     */
    edge(edge) {
        const edgeId = getId(edge);
        return nonNullable(this.#edges.get(edgeId), `Edge ${edgeId} not found in view ${this.#view.id}`);
    }
    /**
     * Find edge by id.
     * @param edge Edge or id
     * @returns {@link EdgeModel} or null if edge is not found
     */
    findEdge(edge) {
        return this.#edges.get(getId(edge)) ?? null;
    }
    /**
     * Iterate over all edges.
     */
    edges() {
        return this.#edges.values();
    }
    /**
     * Iterate over all edges.
     */
    *edgesWithRelation(relation) {
        for (const edge of this.#edges.values()) {
            if (edge.includesRelation(relation)) {
                yield edge;
            }
        }
        return;
    }
    /**
     * Nodes that have references to elements from logical model.
     */
    *elements() {
        // return this.#nodes.values().filter(node => node.hasElement())
        for (const node of this.#nodes.values()) {
            if (node.hasElement()) {
                yield node;
            }
        }
        return;
    }
    /**
     * Checks if the view has the given tag.
     */
    isTagged(tag) {
        return this.tags.includes(tag);
    }
    includesElement(element) {
        return this.#includeElements.has(getId(element));
    }
    includesDeployment(deployment) {
        return this.#includeDeployments.has(getId(deployment));
    }
    includesRelation(relation) {
        return this.#includeRelations.has(getId(relation));
    }
    /**
     * Below are type guards.
     */
    isComputed() {
        return this.#view[_stage] === 'computed';
    }
    isLayouted() {
        return this.#view[_stage] === 'layouted';
    }
    /**
     * @deprecated Use {@link isLayouted} instead
     */
    isDiagram() {
        return this.#view[_stage] === 'layouted';
    }
    isElementView() {
        return this.#view[_type] === 'element';
    }
    isScopedElementView() {
        return this.#view[_type] === 'element' && isTruthy(this.#view.viewOf);
    }
    isDeploymentView() {
        return this.#view[_type] === 'deployment';
    }
    isDynamicView() {
        return this.#view[_type] === 'dynamic';
    }
}
