import { isEmpty, isShallowEqual, isTruthy, unique } from 'remeda';
import { exact, preferDescription, preferSummary, RichText, splitGlobalFqn } from '../types';
import { commonAncestor, hierarchyLevel, ihead, isAncestor, memoizeProp, nameFromFqn, sortNaturalByFqn } from '../utils';
export class ElementModel {
    $model;
    $element;
    /**
     * Don't use in runtime, only for type inference
     */
    Aux;
    id;
    _literalId;
    hierarchyLevel;
    imported;
    constructor($model, $element) {
        this.$model = $model;
        this.$element = $element;
        this.id = this.$element.id;
        this._literalId = this.$element.id;
        const [projectId, fqn] = splitGlobalFqn(this.id);
        if (projectId) {
            this.imported = {
                from: projectId,
                fqn,
            };
            this.hierarchyLevel = hierarchyLevel(fqn);
        }
        else {
            this.imported = null;
            this.hierarchyLevel = hierarchyLevel(this.id);
        }
    }
    get name() {
        return nameFromFqn(this.id);
    }
    get parent() {
        return this.$model.parent(this);
    }
    get kind() {
        return this.$element.kind;
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
     * Returns all tags of the element.
     * It includes tags from the element and its kind.
     */
    get tags() {
        return memoizeProp(this, Symbol.for('tags'), () => {
            return unique([
                ...(this.$element.tags ?? []),
                ...(this.$model.specification.elements[this.$element.kind]?.tags ?? []),
            ]);
        });
    }
    get title() {
        return this.$element.title;
    }
    /**
     * Returns true if the element has a summary and a description
     * (if one is missing - it falls back to another)
     */
    get hasSummary() {
        return !!this.$element.summary && !!this.$element.description &&
            !isShallowEqual(this.$element.summary, this.$element.description);
    }
    /**
     * Short description of the element.
     * Falls back to description if summary is not provided.
     */
    get summary() {
        return RichText.memoize(this, 'summary', preferSummary(this.$element));
    }
    /**
     * Long description of the element.
     * Falls back to summary if description is not provided.
     */
    get description() {
        return RichText.memoize(this, 'description', preferDescription(this.$element));
    }
    get technology() {
        return this.$element.technology ?? null;
    }
    get links() {
        return this.$element.links ?? [];
    }
    get defaultView() {
        return memoizeProp(this, Symbol.for('defaultView'), () => ihead(this.scopedViews()) ?? null);
    }
    get isRoot() {
        return this.parent === null;
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
            ...this.$element.style,
        }));
    }
    get projectId() {
        return this.imported?.from ?? this.$model.projectId;
    }
    isAncestorOf(another) {
        return isAncestor(this, another);
    }
    isDescendantOf(another) {
        return isAncestor(another, this);
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
        return common ? this.$model.element(common) : null;
    }
    children() {
        return this.$model.children(this);
    }
    /**
     * Get all descendant elements (i.e. children, children’s children, etc.)
     */
    descendants(sort) {
        if (sort) {
            const sorted = sortNaturalByFqn([...this.$model.descendants(this)], sort);
            return sorted[Symbol.iterator]();
        }
        return this.$model.descendants(this);
    }
    /**
     * Get all sibling (i.e. same parent)
     */
    siblings() {
        return this.$model.siblings(this);
    }
    /**
     * Resolve siblings of the element and its ancestors
     * (from closest parent to root)
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
    outgoing(filter = 'all') {
        return this.$model.outgoing(this, filter);
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
    get allOutgoing() {
        return memoizeProp(this, Symbol.for('allOutgoing'), () => new Set(this.outgoing()));
    }
    get allIncoming() {
        return memoizeProp(this, Symbol.for('allIncoming'), () => new Set(this.incoming()));
    }
    /**
     * Iterate over all views that include this element.
     */
    views() {
        return memoizeProp(this, Symbol.for('views'), () => {
            const views = new Set();
            for (const view of this.$model.views()) {
                if (view.includesElement(this.id)) {
                    views.add(view);
                }
            }
            return views;
        });
    }
    /**
     * Iterate over all views that scope this element.
     * It is possible that element is not included in the view.
     */
    scopedViews() {
        return memoizeProp(this, Symbol.for('scopedViews'), () => {
            const views = new Set();
            for (const vm of this.$model.views()) {
                if (vm.isScopedElementView() && vm.viewOf.id === this.id) {
                    views.add(vm);
                }
            }
            return views;
        });
    }
    /**
     * @returns true if the element is deployed
     */
    isDeployed() {
        return isTruthy(ihead(this.deployments()));
    }
    deployments() {
        return this.$model.deployment.instancesOf(this);
    }
    hasMetadata() {
        return !!this.$element.metadata && !isEmpty(this.$element.metadata);
    }
    getMetadata(field) {
        if (field) {
            return this.$element.metadata?.[field];
        }
        return this.$element.metadata ?? {};
    }
    /**
     * Checks if the element has the given tag.
     */
    isTagged(tag) {
        return this.tags.includes(tag);
    }
}
