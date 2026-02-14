import { isEmpty, isEmptyish, isShallowEqual } from 'remeda';
import { FqnRef, preferDescription, preferSummary, RichText, } from '../types';
import { commonAncestor } from '../utils/fqn';
export class RelationshipModel {
    model;
    $relationship;
    source;
    target;
    /**
     * Common ancestor of the source and target elements.
     * Represents the boundary of the Relation.
     */
    boundary;
    constructor(model, $relationship) {
        this.model = model;
        this.$relationship = $relationship;
        this.source = model.element(FqnRef.flatten($relationship.source));
        this.target = model.element(FqnRef.flatten($relationship.target));
        const parent = commonAncestor(this.source.id, this.target.id);
        this.boundary = parent ? this.model.element(parent) : null;
    }
    get id() {
        return this.$relationship.id;
    }
    get expression() {
        return `${this.source.id} -> ${this.target.id}`;
    }
    get title() {
        if (isEmptyish(this.$relationship.title)) {
            return null;
        }
        return this.$relationship.title;
    }
    get technology() {
        if (isEmptyish(this.$relationship.technology)) {
            const spec = this.kind && this.model.specification.relationships[this.kind];
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
    get navigateTo() {
        return this.$relationship.navigateTo ? this.model.view(this.$relationship.navigateTo) : null;
    }
    get tags() {
        return this.$relationship.tags ?? [];
    }
    get kind() {
        return this.$relationship.kind ?? null;
    }
    get links() {
        return this.$relationship.links ?? [];
    }
    get color() {
        return this.$relationship.color ?? this.model.$styles.defaults.relationship.color;
    }
    get line() {
        return this.$relationship.line ?? this.model.$styles.defaults.relationship.line;
    }
    get head() {
        return this.$relationship.head ?? this.model.$styles.defaults.relationship.arrow;
    }
    get tail() {
        return this.$relationship.tail;
    }
    /**
     * Iterate over all views that include this relationship.
     */
    *views() {
        for (const view of this.model.views()) {
            if (view.includesRelation(this.id)) {
                yield view;
            }
        }
        return;
    }
    isDeploymentRelation() {
        return false;
    }
    isModelRelation() {
        return true;
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
