import { isEmpty, isEmptyish, isShallowEqual, isTruthy, unique } from 'remeda';
import { exact, preferDescription, preferSummary, RichText } from '../types';
import { commonAncestor, hierarchyLevel, ihead, memoizeProp, nameFromFqn, nonNullable } from '../utils';
import { difference, intersection, union } from '../utils/set';
class AbstractDeploymentElementModel {
    /**
     * Don't use in runtime, only for type inference
     */
    Aux;
    get style() {
        return memoizeProp(this, 'style', () => exact({
            shape: this.$model.$styles.defaults.shape,
            color: this.$model.$styles.defaults.color,
            border: this.$model.$styles.defaults.border,
            opacity: this.$model.$styles.defaults.opacity,
            size: this.$model.$styles.defaults.size,
            padding: this.$model.$styles.defaults.padding,
            textSize: this.$model.$styles.defaults.text,
            iconPosition: this.$model.$styles.defaults.iconPosition,
            ...this.$node.style,
        }));
    }
    get name() {
        return nameFromFqn(this.id);
    }
    get shape() {
        return this.style.shape;
    }
    get color() {
        return this.style.color;
    }
    get icon() {
        return this.style.icon ?? null;
    }
    /**
     * Short description of the element.
     * Falls back to description if summary is not provided.
     */
    get summary() {
        return RichText.memoize(this, 'summary', preferSummary(this.$node));
    }
    /**
     * Long description of the element.
     * Falls back to summary if description is not provided.
     */
    get description() {
        return RichText.memoize(this, 'description', preferDescription(this.$node));
    }
    get technology() {
        return this.$node.technology ?? null;
    }
    get links() {
        return this.$node.links ?? [];
    }
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    ancestors() {
        return this.$model.ancestors(this);
    }
    /**
     * Returns the common ancestor of this element and another element.
     */
    commonAncestor(another) {
        const common = commonAncestor(this.id, another.id);
        return common ? this.$model.node(common) : null;
    }
    /**
     * Get all sibling (i.e. same parent)
     */
    siblings() {
        return this.$model.siblings(this);
    }
    /**
     * Check if the element is a sibling of another element
     */
    isSibling(other) {
        return this.parent === other.parent;
    }
    /**
     * Resolve siblings of the element and its ancestors
     *  (from closest to root)
     */
    *ascendingSiblings() {
        yield* this.siblings();
        for (const ancestor of this.ancestors()) {
            yield* ancestor.siblings();
        }
        return;
    }
    /**
     * Resolve siblings of the element and its ancestors
     *  (from root to closest)
     */
    *descendingSiblings() {
        for (const ancestor of [...this.ancestors()].reverse()) {
            yield* ancestor.siblings();
        }
        yield* this.siblings();
        return;
    }
    incoming(filter = 'all') {
        return this.$model.incoming(this, filter);
    }
    outgoing(filter = 'all') {
        return this.$model.outgoing(this, filter);
    }
    *incomers(filter = 'all') {
        const unique = new Set();
        for (const r of this.incoming(filter)) {
            if (unique.has(r.source.id)) {
                continue;
            }
            unique.add(r.source.id);
            yield r.source;
        }
        return;
    }
    *outgoers(filter = 'all') {
        const unique = new Set();
        for (const r of this.outgoing(filter)) {
            if (unique.has(r.target.id)) {
                continue;
            }
            unique.add(r.target.id);
            yield r.target;
        }
        return;
    }
    /**
     * Iterate over all views that include this deployment element.
     */
    *views() {
        for (const view of this.$model.views()) {
            if (view._type !== 'deployment') {
                continue;
            }
            if (view.includesDeployment(this.id)) {
                yield view;
            }
        }
    }
    // type guard
    isDeploymentNode() {
        return false;
    }
    // type guard
    isInstance() {
        return false;
    }
    get allOutgoing() {
        return memoizeProp(this, Symbol.for('allOutgoing'), () => RelationshipsAccum.from(new Set(this.outgoingModelRelationships()), new Set(this.outgoing())));
    }
    get allIncoming() {
        return memoizeProp(this, Symbol.for('allIncoming'), () => RelationshipsAccum.from(new Set(this.incomingModelRelationships()), new Set(this.incoming())));
    }
    hasMetadata() {
        return !!this.$node.metadata && !isEmpty(this.$node.metadata);
    }
    getMetadata(field) {
        if (field) {
            return this.$node.metadata?.[field];
        }
        return this.$node.metadata ?? {};
    }
    /**
     * Checks if the deployment element has the given tag.
     */
    isTagged(tag) {
        return this.tags.includes(tag);
    }
}
export class DeploymentNodeModel extends AbstractDeploymentElementModel {
    $model;
    $node;
    id;
    _literalId;
    title;
    hierarchyLevel;
    constructor($model, $node) {
        super();
        this.$model = $model;
        this.$node = $node;
        this.id = $node.id;
        this._literalId = $node.id;
        this.title = $node.title;
        this.hierarchyLevel = hierarchyLevel($node.id);
    }
    get parent() {
        return this.$model.parent(this);
    }
    get kind() {
        return this.$node.kind;
    }
    get tags() {
        return memoizeProp(this, Symbol.for('tags'), () => {
            return unique([
                ...(this.$node.tags ?? []),
                ...(this.$model.$model.specification.deployments[this.kind]?.tags ?? []),
            ]);
        });
    }
    children() {
        return this.$model.children(this);
    }
    descendants(sort = 'desc') {
        return this.$model.descendants(this, sort);
    }
    isDeploymentNode() {
        return true;
    }
    /**
     * Iterate over all instances nested in this deployment node.
     */
    *instances() {
        for (const nested of this.descendants('desc')) {
            if (nested.isInstance()) {
                yield nested;
            }
        }
        return;
    }
    /**
     * Returns deployed instance inside this deployment node
     * if only there are no more instances
     */
    onlyOneInstance() {
        const children = this.children();
        if (children.size !== 1) {
            return null;
        }
        const child = ihead(children);
        if (!child) {
            return null;
        }
        return child.isInstance() ? child : child.onlyOneInstance();
    }
    /**
     * Cached result of relationships from instances
     */
    _relationshipsFromInstances = null;
    relationshipsFromInstances() {
        if (this._relationshipsFromInstances) {
            return this._relationshipsFromInstances;
        }
        const { outgoing, incoming, } = (this._relationshipsFromInstances = {
            outgoing: new Set(),
            incoming: new Set(),
        });
        for (const instance of this.instances()) {
            for (const r of instance.element.outgoing()) {
                outgoing.add(r);
            }
            for (const r of instance.element.incoming()) {
                incoming.add(r);
            }
        }
        return this._relationshipsFromInstances;
    }
    /**
     * We return only relationships that are not already present in nested instances
     */
    outgoingModelRelationships() {
        return this.relationshipsFromInstances().outgoing.values();
    }
    /**
     * We return only relationships that are not already present in nested instances
     */
    incomingModelRelationships() {
        return this.relationshipsFromInstances().incoming.values();
    }
    /**
     * Returns an iterator of relationships between nested instances
     */
    internalModelRelationships() {
        const { outgoing, incoming, } = this.relationshipsFromInstances();
        return intersection(incoming, outgoing);
    }
}
export class DeployedInstanceModel extends AbstractDeploymentElementModel {
    $model;
    $instance;
    element;
    id;
    _literalId;
    title;
    hierarchyLevel;
    constructor($model, $instance, element) {
        super();
        this.$model = $model;
        this.$instance = $instance;
        this.element = element;
        this.id = $instance.id;
        this._literalId = $instance.id;
        this.title = $instance.title ?? element.title;
        this.hierarchyLevel = hierarchyLevel($instance.id);
    }
    get $node() {
        return this.$instance;
    }
    get parent() {
        return nonNullable(this.$model.parent(this), `Parent of ${this.id} not found`);
    }
    get style() {
        return memoizeProp(this, 'style', () => exact({
            shape: this.$model.$styles.defaults.shape,
            color: this.$model.$styles.defaults.color,
            border: this.$model.$styles.defaults.border,
            opacity: this.$model.$styles.defaults.opacity,
            size: this.$model.$styles.defaults.size,
            padding: this.$model.$styles.defaults.padding,
            textSize: this.$model.$styles.defaults.text,
            iconPosition: this.$model.$styles.defaults.iconPosition,
            ...this.element.$element.style,
            ...this.$instance.style,
        }));
    }
    get tags() {
        return memoizeProp(this, Symbol.for('tags'), () => {
            return unique([
                ...(this.$instance.tags ?? []),
                ...this.element.tags,
            ]);
        });
    }
    get kind() {
        return this.element.kind;
    }
    get summary() {
        return RichText.memoize(this, 'summary', preferSummary(this.$instance) ?? preferSummary(this.element.$element));
    }
    get description() {
        return RichText.memoize(this, 'description', preferDescription(this.$instance) ?? preferDescription(this.element.$element));
    }
    get technology() {
        return this.$instance.technology ?? this.element.technology ?? null;
    }
    get links() {
        return this.$instance.links ?? this.element.links;
    }
    isInstance() {
        return true;
    }
    outgoingModelRelationships() {
        return this.element.outgoing();
    }
    incomingModelRelationships() {
        return this.element.incoming();
    }
    /**
     * Iterate over all views that include this instance.
     * (Some views may include the parent deployment node instead of the instance.)
     */
    *views() {
        for (const view of this.$model.views()) {
            if (view._type !== 'deployment') {
                continue;
            }
            if (view.includesDeployment(this.id)) {
                yield view;
                continue;
            }
            // check if the view includes parent referecing this element
            if (view.includesDeployment(this.parent.id)
                && this.parent.onlyOneInstance()) {
                yield view;
            }
        }
    }
}
export class NestedElementOfDeployedInstanceModel {
    instance;
    element;
    constructor(instance, element) {
        this.instance = instance;
        this.element = element;
    }
    get id() {
        return this.instance.id;
    }
    get _literalId() {
        return this.instance.id;
    }
    get style() {
        return memoizeProp(this, 'style ', () => ({
            shape: this.element.shape,
            color: this.element.color,
            ...this.element.$element.style,
        }));
    }
    get shape() {
        return this.element.shape;
    }
    get color() {
        return this.element.color;
    }
    get title() {
        return this.element.title;
    }
    get summary() {
        return this.element.summary;
    }
    get description() {
        return this.element.description;
    }
    get technology() {
        return this.element.technology;
    }
    isDeploymentNode() {
        return false;
    }
    isInstance() {
        return false;
    }
}
export class DeploymentRelationModel {
    $model;
    $relationship;
    boundary;
    source;
    target;
    constructor($model, $relationship) {
        this.$model = $model;
        this.$relationship = $relationship;
        this.source = $model.deploymentRef($relationship.source);
        this.target = $model.deploymentRef($relationship.target);
        const parent = commonAncestor(this.source.id, this.target.id);
        this.boundary = parent ? this.$model.node(parent) : null;
    }
    get id() {
        return this.$relationship.id;
    }
    get expression() {
        return `${this.source.id} -> ${this.target.id}`;
    }
    get title() {
        if (!isTruthy(this.$relationship.title)) {
            return null;
        }
        return this.$relationship.title;
    }
    get technology() {
        if (isEmptyish(this.$relationship.technology)) {
            const spec = this.kind && this.$model.specification.relationships[this.kind];
            return spec?.technology ?? null;
        }
        return this.$relationship.technology;
    }
    /**
     * Returns true if the relationship has a summary and a description
     * (if one is missing - it falls back to another)
     */
    get hasSummary() {
        return !!this.$relationship.summary && !!this.$relationship.description &&
            !isShallowEqual(this.$relationship.summary, this.$relationship.description);
    }
    /**
     * Short description of the relationship.
     * Falls back to description if summary is not provided.
     */
    get summary() {
        return RichText.memoize(this, 'summary', preferSummary(this.$relationship));
    }
    /**
     * Long description of the relationship.
     * Falls back to summary if description is not provided.
     */
    get description() {
        return RichText.memoize(this, 'description', preferDescription(this.$relationship));
    }
    get tags() {
        return this.$relationship.tags ?? [];
    }
    get kind() {
        return this.$relationship.kind ?? null;
    }
    get navigateTo() {
        return this.$relationship.navigateTo ? this.$model.$model.view(this.$relationship.navigateTo) : null;
    }
    get links() {
        return this.$relationship.links ?? [];
    }
    get color() {
        return this.$relationship.color ?? this.$model.$styles.defaults.relationship.color;
    }
    get line() {
        return this.$relationship.line ?? this.$model.$styles.defaults.relationship.line;
    }
    get head() {
        return this.$relationship.head ?? this.$model.$styles.defaults.relationship.arrow;
    }
    get tail() {
        return this.$relationship.tail;
    }
    *views() {
        for (const view of this.$model.views()) {
            if (view.includesRelation(this.id)) {
                yield view;
            }
        }
        return;
    }
    isDeploymentRelation() {
        return true;
    }
    isModelRelation() {
        return false;
    }
    hasMetadata() {
        return !!this.$relationship.metadata && !isEmpty(this.$relationship.metadata);
    }
    getMetadata(field) {
        if (field) {
            return this.$relationship.metadata?.[field];
        }
        return this.$relationship.metadata ?? {};
    }
    /**
     * Checks if the relationship has the given tag.
     */
    isTagged(tag) {
        return this.tags.includes(tag);
    }
}
export class RelationshipsAccum {
    model;
    deployment;
    static empty() {
        return new RelationshipsAccum();
    }
    static from(model, deployment) {
        return new RelationshipsAccum(new Set(model), new Set(deployment));
    }
    /**
     * @param model relationships from logical model
     * @param deployment relationships from deployment model
     */
    constructor(model = new Set(), deployment = new Set()) {
        this.model = model;
        this.deployment = deployment;
    }
    get isEmpty() {
        return this.model.size === 0 && this.deployment.size === 0;
    }
    get nonEmpty() {
        return this.model.size > 0 || this.deployment.size > 0;
    }
    get size() {
        return this.model.size + this.deployment.size;
    }
    /**
     * Returns new Accum containing all the elements which are both in this and otherAccum
     */
    intersect(otherAccum) {
        return RelationshipsAccum.from(intersection(this.model, otherAccum.model), intersection(this.deployment, otherAccum.deployment));
    }
    /**
     * Returns new Accum containing all the elements which are both in this and otherAccum
     */
    difference(otherAccum) {
        return RelationshipsAccum.from(difference(this.model, otherAccum.model), difference(this.deployment, otherAccum.deployment));
    }
    /**
     * Returns new Accum containing all the elements from both
     */
    union(otherAccum) {
        return RelationshipsAccum.from(union(this.model, otherAccum.model), union(this.deployment, otherAccum.deployment));
    }
}
