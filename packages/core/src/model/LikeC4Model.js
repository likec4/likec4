import { entries, hasAtLeast, isEmpty, map, pipe, prop, sort, sortBy, split, values } from 'remeda';
import { LikeC4Styles } from '../styles/LikeC4Styles';
import { _stage, GlobalFqn, isGlobalFqn, isOnStage, whereOperatorAsPredicate } from '../types';
import { compareNatural, compareNaturalHierarchically, ifilter, invariant, memoizeProp, nonNullable } from '../utils';
import { ancestorsFqn, commonAncestor, parentFqn, sortParentsFirst } from '../utils/fqn';
import { DefaultMap } from '../utils/mnemonist';
import { LikeC4DeploymentModel } from './DeploymentModel';
import { ElementModel } from './ElementModel';
import { RelationshipModel } from './RelationModel';
import { getId, getViewFolderPath, normalizeViewPath, VIEW_FOLDERS_SEPARATOR } from './utils';
import { LikeC4ViewModel } from './view/LikeC4ViewModel';
import { LikeC4ViewsFolder } from './view/LikeC4ViewsFolder';
export class LikeC4Model {
    /**
     * Don't use in runtime, only for type inference
     */
    Aux;
    _elements = new Map();
    // Parent element for given FQN
    _parents = new Map();
    // Children elements for given FQN
    _children = new DefaultMap(() => new Set());
    _rootElements = new Set();
    _relations = new Map();
    // Incoming to an element or its descendants
    _incoming = new DefaultMap(() => new Set());
    // Outgoing from an element or its descendants
    _outgoing = new DefaultMap(() => new Set());
    // Relationships inside the element, among descendants
    _internal = new DefaultMap(() => new Set());
    _views = new Map();
    _rootViewFolder;
    _viewFolders = new Map();
    _viewFolderItems = new DefaultMap(() => new Set());
    _allTags = new DefaultMap(() => new Set());
    static fromParsed(model) {
        return new LikeC4Model(model);
    }
    static create(model) {
        return new LikeC4Model(model);
    }
    /**
     * Creates a new LikeC4Model instance and infers types from a model dump.\
     * Model dump expected to be computed or layouted.
     *
     * @typeParam D - A constant type parameter extending LikeC4ModelDump
     * @param dump - The model dump to create the instance from
     * @returns A  new LikeC4Model instance with types inferred from the dump
     */
    static fromDump(dump) {
        const { _stage: stage = 'layouted', projectId = 'unknown', project, globals, imports, deployments, views, relations, elements, specification, } = dump;
        return new LikeC4Model({
            [_stage]: stage,
            projectId,
            project,
            globals: {
                predicates: globals?.predicates ?? {},
                dynamicPredicates: globals?.dynamicPredicates ?? {},
                styles: globals?.styles ?? {},
            },
            imports: imports ?? {},
            deployments: {
                elements: deployments?.elements ?? {},
                relations: deployments?.relations ?? {},
            },
            views: views ?? {},
            relations: relations ?? {},
            elements: elements ?? {},
            specification,
        });
    }
    deployment;
    $data;
    constructor($data) {
        this.$data = $data;
        for (const [, element] of entries($data.elements)) {
            const el = this.addElement(element);
            for (const tag of el.tags) {
                this._allTags.get(tag).add(el);
            }
        }
        for (const [projectId, elements] of entries($data.imports ?? {})) {
            for (const element of sortParentsFirst(elements)) {
                const el = this.addImportedElement(projectId, element);
                for (const tag of el.tags) {
                    this._allTags.get(tag).add(el);
                }
            }
        }
        for (const relation of values($data.relations)) {
            const el = this.addRelation(relation);
            for (const tag of el.tags) {
                this._allTags.get(tag).add(el);
            }
        }
        this.deployment = new LikeC4DeploymentModel(this);
        if (isOnStage($data, 'computed') || isOnStage($data, 'layouted')) {
            const compare = compareNaturalHierarchically(VIEW_FOLDERS_SEPARATOR);
            const views = pipe(values($data.views), map(view => ({
                view,
                path: normalizeViewPath(view.title ?? view.id),
                folderPath: view.title && getViewFolderPath(view.title) || '',
            })), 
            // Sort hierarchically by groups, but keep same order within groups
            sort((a, b) => compare(a.folderPath, b.folderPath)));
            const getOrCreateFolder = (path) => {
                let folder = this._viewFolders.get(path);
                if (!folder) {
                    const segments = split(path, VIEW_FOLDERS_SEPARATOR);
                    invariant(hasAtLeast(segments, 1), `View group path "${path}" must have at least one element`);
                    let defaultView;
                    // Root group has "index" as default view
                    if (path === '') {
                        defaultView = views.find(view => view.view.id === 'index');
                    }
                    else {
                        defaultView = views.find(view => view.path === path);
                    }
                    folder = new LikeC4ViewsFolder(this, segments, defaultView?.view.id);
                    this._viewFolders.set(path, folder);
                }
                return folder;
            };
            this._rootViewFolder = getOrCreateFolder('');
            // Process view groups
            // Sort in natural order to preserve hierarchy
            for (const { folderPath } of views) {
                if (this._viewFolders.has(folderPath)) {
                    continue;
                }
                // Create groups for each segment of the path
                split(folderPath, VIEW_FOLDERS_SEPARATOR).reduce((segments, segment) => {
                    const parent = segments.join(VIEW_FOLDERS_SEPARATOR);
                    const path = isEmpty(parent) ? segment : parent + VIEW_FOLDERS_SEPARATOR + segment;
                    const folder = getOrCreateFolder(path);
                    this._viewFolderItems.get(parent).add(folder);
                    segments.push(segment);
                    return segments;
                }, []);
            }
            for (const { view, folderPath } of views) {
                const vm = new LikeC4ViewModel(this, getOrCreateFolder(folderPath), view, $data.manualLayouts?.[view.id]);
                this._viewFolderItems.get(folderPath).add(vm);
                this._views.set(view.id, vm);
                for (const tag of vm.tags) {
                    this._allTags.get(tag).add(vm);
                }
            }
        }
        else {
            // Model is not computed or layouted, but we still need to create root folder
            this._rootViewFolder = new LikeC4ViewsFolder(this, [''], undefined);
            this._viewFolders.set(this._rootViewFolder.path, this._rootViewFolder);
        }
    }
    /**
     * Type narrows the model to the parsed stage.
     * This is useful for tests
     */
    get asParsed() {
        return this;
    }
    /**
     * Type narrows the model to the layouted stage.
     * This is useful for tests
     */
    get asComputed() {
        return this;
    }
    /**
     * Type narrows the model to the layouted stage.
     * This is useful for tests
     */
    get asLayouted() {
        return this;
    }
    /**
     * Returns the styles configuration for the project.
     */
    get $styles() {
        return memoizeProp(this, 'styles', () => LikeC4Styles.from(this.project.styles, this.specification.customColors));
    }
    /**
     * Type guard the model to the parsed stage.
     */
    isParsed() {
        return this.stage === 'parsed';
    }
    /**
     * Type guard the model to the layouted stage.
     */
    isLayouted() {
        return this.stage === 'layouted';
    }
    /**
     * Type guard the model to the computed stage.
     */
    isComputed() {
        return this.stage === 'computed';
    }
    /**
     * Keeping here for backward compatibility
     * @deprecated use {@link $data}
     */
    get $model() {
        return this.$data;
    }
    get stage() {
        return this.$data[_stage];
    }
    /**
     * Returns the Project ID associated with the model.
     * If the project ID is not defined in the model, it returns "default".
     */
    get projectId() {
        return this.$data.projectId ?? 'default';
    }
    /**
     * Returns the project associated with the model.
     * If the project is not defined in the model, it returns a default project with the ID "default".
     */
    get project() {
        return this.$data.project ?? memoizeProp(this, Symbol.for('project'), () => ({
            id: this.projectId,
            styles: {},
            manualLayouts: {},
        }));
    }
    get specification() {
        return this.$data.specification;
    }
    get globals() {
        return memoizeProp(this, Symbol.for('globals'), () => ({
            predicates: {
                ...this.$data.globals?.predicates,
            },
            dynamicPredicates: {
                ...this.$data.globals?.dynamicPredicates,
            },
            styles: {
                ...this.$data.globals?.styles,
            },
        }));
    }
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
    element(el) {
        if (el instanceof ElementModel) {
            return el;
        }
        const id = getId(el);
        return nonNullable(this._elements.get(id), `Element ${id} not found`);
    }
    /**
     * Returns the element with the given FQN.
     *
     * @returns Element if found, null otherwise
     * @note Method is not type-safe as {@link element}
     *
     * @example
     * model.findElement('cloud.frontend')
     */
    findElement(el) {
        return this._elements.get(getId(el)) ?? null;
    }
    /**
     * Returns the root elements of the model.
     */
    roots() {
        return this._rootElements.values();
    }
    /**
     * Returns all elements in the model.
     */
    elements() {
        return this._elements.values();
    }
    /**
     * Returns all relationships in the model.
     */
    relationships() {
        return this._relations.values();
    }
    relationship(rel, type) {
        if (type === 'deployment') {
            return this.deployment.relationship(rel);
        }
        const id = getId(rel);
        let model = this._relations.get(id) ?? null;
        if (model || type === 'model') {
            return nonNullable(model, `Model relation ${id} not found`);
        }
        // We did not find the relation in the model, let's search in the deployment
        return nonNullable(this.deployment.findRelationship(id), `No model/deployment relation ${id} not found`);
    }
    findRelationship(id, type) {
        if (type === 'deployment') {
            return this.deployment.findRelationship(id);
        }
        let model = this._relations.get(getId(id)) ?? null;
        if (model || type === 'model') {
            return model;
        }
        return this.deployment.findRelationship(id);
    }
    /**
     * Returns all views in the model.
     */
    views() {
        return this._views.values();
    }
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
    view(viewId) {
        const id = getId(viewId);
        return nonNullable(this._views.get(id), `View ${id} not found`);
    }
    /**
     * Returns a specific view by its ID.
     * @note Method is not type-safe as {@link view}
     *
     * @example
     * model.findView('index')
     */
    findView(viewId) {
        return this._views.get(viewId) ?? null;
    }
    /**
     * Returns manual layout snapshot for given view ID, if any.
     */
    findManualLayout(viewId) {
        // manualLayouts available in computed/layouted models
        if ('manualLayouts' in this.$data) {
            const view = this.$data.manualLayouts?.[viewId];
            return view ?? null;
        }
        return null;
    }
    /**
     * Returns a view folder by its path.
     * Path is extracted from the view title, e.g. "Group 1/Group 2/View" -> "Group 1/Group 2"
     * @throws Error if view folder is not found.
     */
    viewFolder(path) {
        return nonNullable(this._viewFolders.get(path), `View folder ${path} not found`);
    }
    /**
     * Root folder is a special one with an empty path and used only for internal purposes.
     * It is not visible to the user and should be used only to get top-level folders and views.
     */
    get rootViewFolder() {
        return this._rootViewFolder;
    }
    /**
     * Whether the model has any view folders.
     */
    get hasViewFolders() {
        // Root view folder is always present
        return this._viewFolders.size > 1;
    }
    /**
     * Returns all children of a view folder.
     * Path is extracted from the view title, e.g. "Group 1/Group 2/View" -> "Group 1/Group 2"
     *
     * @throws Error if view folder is not found.
     */
    viewFolderItems(path) {
        invariant(this._viewFolders.has(path), `View folder ${path} not found`);
        return this._viewFolderItems.get(path);
    }
    /**
     * Returns the parent element of given element.
     * @see ancestors
     */
    parent(element) {
        const id = getId(element);
        return this._parents.get(id) || null;
    }
    /**
     * Get all children of the element (only direct children),
     * @see descendants
     */
    children(element) {
        const id = getId(element);
        return this._children.get(id);
    }
    /**
     * Get all sibling (i.e. same parent)
     */
    *siblings(element) {
        const id = getId(element);
        const parent = this._parents.get(id);
        const siblings = parent ? this._children.get(parent.id).values() : this.roots();
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
        while ((parent = this._parents.get(id))) {
            yield parent;
            id = parent.id;
        }
        return;
    }
    /**
     * Get all descendant elements (i.e. children, children’s children, etc.)
     */
    *descendants(element) {
        for (const child of this.children(element)) {
            yield child;
            yield* this.descendants(child.id);
        }
        return;
    }
    /**
     * Incoming relationships to the element and its descendants
     * @see incomers
     */
    *incoming(element, filter = 'all') {
        const id = getId(element);
        for (const rel of this._incoming.get(id)) {
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
        for (const rel of this._outgoing.get(id)) {
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
    /**
     * Returns array of all tags used in the model, sorted naturally.\
     * Use {@link specification.tags} to get all defined tags
     */
    get tags() {
        return memoizeProp(this, 'tags', () => sort([...this._allTags.keys()], compareNatural));
    }
    /**
     * Returns all tags used in the model, sorted by usage count (descending).
     */
    get tagsSortedByUsage() {
        return memoizeProp(this, 'tagsSortedByUsage', () => pipe([...this._allTags.entries()], map(([tag, tagged]) => ({
            tag,
            count: tagged.size,
            tagged,
        })), sort((a, b) => compareNatural(a.tag, b.tag)), sortBy([prop('count'), 'desc'])));
    }
    findByTag(tag, type) {
        return ifilter(this._allTags.get(tag), (el) => {
            if (type === 'elements') {
                return el instanceof ElementModel;
            }
            if (type === 'views') {
                return el instanceof LikeC4ViewModel;
            }
            if (type === 'relationships') {
                return el instanceof RelationshipModel;
            }
            return true;
        });
    }
    /**
     * Returns all elements of the given kind.
     */
    *elementsOfKind(kind) {
        for (const el of this._elements.values()) {
            if (el.kind === kind) {
                yield el;
            }
        }
        return;
    }
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
    *elementsWhere(where) {
        const predicate = whereOperatorAsPredicate(where);
        for (const el of this._elements.values()) {
            if (predicate(el)) {
                yield el;
            }
        }
        return;
    }
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
    *relationshipsWhere(where) {
        const predicate = whereOperatorAsPredicate(where);
        for (const rel of this._relations.values()) {
            if (predicate(rel)) {
                yield rel;
            }
        }
        return;
    }
    addElement(element) {
        if (this._elements.has(element.id)) {
            throw new Error(`Element ${element.id} already exists`);
        }
        const el = new ElementModel(this, Object.freeze(element));
        this._elements.set(el.id, el);
        const parentId = parentFqn(el.id);
        if (parentId) {
            invariant(this._elements.has(parentId), `Parent ${parentId} of ${el.id} not found`);
            this._parents.set(el.id, this.element(parentId));
            this._children.get(parentId).add(el);
        }
        else {
            this._rootElements.add(el);
        }
        return el;
    }
    addImportedElement(projectId, element) {
        invariant(!isGlobalFqn(element.id), `Imported element already has global FQN`);
        const id = GlobalFqn(projectId, element.id);
        if (this._elements.has(id)) {
            throw new Error(`Element ${id} already exists`);
        }
        const el = new ElementModel(this, Object.freeze({
            ...element,
            id,
        }));
        this._elements.set(el.id, el);
        let parentId = parentFqn(el.id);
        while (parentId) {
            // For imported elements - id has format `@projectId.fqn`
            // We need to exclude `@projectId` from the parentId
            if (parentId.includes('.') && this._elements.has(parentId)) {
                this._parents.set(el.id, this.element(parentId));
                this._children.get(parentId).add(el);
                return el;
            }
            parentId = parentFqn(parentId);
        }
        this._rootElements.add(el);
        return el;
    }
    addRelation(relation) {
        if (this._relations.has(relation.id)) {
            throw new Error(`Relation ${relation.id} already exists`);
        }
        const rel = new RelationshipModel(this, Object.freeze(relation));
        const { source, target } = rel;
        this._relations.set(rel.id, rel);
        this._incoming.get(target.id).add(rel);
        this._outgoing.get(source.id).add(rel);
        const relParent = commonAncestor(source.id, target.id);
        // Process internal relationships
        if (relParent) {
            for (const ancestor of [relParent, ...ancestorsFqn(relParent)]) {
                this._internal.get(ancestor).add(rel);
            }
        }
        // Process source hierarchy
        for (const sourceAncestor of ancestorsFqn(source.id)) {
            if (sourceAncestor === relParent) {
                break;
            }
            this._outgoing.get(sourceAncestor).add(rel);
        }
        // Process target hierarchy
        for (const targetAncestor of ancestorsFqn(target.id)) {
            if (targetAncestor === relParent) {
                break;
            }
            this._incoming.get(targetAncestor).add(rel);
        }
        return rel;
    }
}
(function (LikeC4Model) {
    LikeC4Model.EMPTY = LikeC4Model.create({
        _stage: 'computed',
        projectId: 'default',
        project: { id: 'default' },
        specification: {
            elements: {},
            relationships: {},
            deployments: {},
            tags: {},
        },
        globals: {
            predicates: {},
            dynamicPredicates: {},
            styles: {},
        },
        deployments: {
            elements: {},
            relations: {},
        },
        elements: {},
        relations: {},
        views: {},
        imports: {},
    });
})(LikeC4Model || (LikeC4Model = {}));
