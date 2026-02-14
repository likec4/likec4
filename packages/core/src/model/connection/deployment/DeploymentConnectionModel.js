import { invariant, stringHash } from '../../../utils';
import { customInspectSymbol } from '../../../utils/const';
import { equals } from '../../../utils/set';
import { RelationshipsAccum, } from '../../DeploymentElementModel';
/**
 * Connection is ephemeral entity, result of a resolving relationships between source and target.
 * Includes direct relationships and/or between their nested elements.
 */
export class DeploymentConnectionModel {
    source;
    target;
    relations;
    id;
    constructor(source, target, relations) {
        this.source = source;
        this.target = target;
        this.relations = relations;
        this.id = stringHash(`deployment:${source.id}:${target.id}`);
    }
    /**
     * Human readable expression of the connection
     * Mostly used for testing and debugging
     */
    get expression() {
        return `${this.source.id} -> ${this.target.id}`;
    }
    _boundary;
    /**
     * Common ancestor of the source and target elements.
     * Represents the boundary of the connection.
     */
    get boundary() {
        this._boundary ??= this.source.commonAncestor(this.target);
        return this._boundary;
    }
    nonEmpty() {
        return this.relations.nonEmpty;
    }
    [customInspectSymbol](
    // @ts-ignore
    _depth, 
    // @ts-ignore
    _inspectOptions, 
    // @ts-ignore
    _inspect) {
        const asString = this.toString();
        // Trick so that node displays the name of the constructor
        Object.defineProperty(asString, 'constructor', {
            value: DeploymentConnectionModel,
            enumerable: false,
        });
        return asString;
    }
    toString() {
        const model = [...this.relations.model].map(c => '    ' + c.expression);
        if (model.length) {
            model.unshift('  model:');
        }
        else {
            model.unshift('  model: []');
        }
        const deployment = [...this.relations.deployment].map(c => '    ' + c.expression);
        if (deployment.length) {
            deployment.unshift('  deployment:');
        }
        else {
            deployment.unshift('  deployment: []');
        }
        return [
            this.expression,
            ...model,
            ...deployment,
        ].join('\n');
    }
    /**
     * Check if connection contains deployment relation,
     * that is directly connected to source or target.
     */
    hasDirectDeploymentRelation() {
        for (const relation of this.relations.deployment) {
            if (relation.source.id === this.source.id || relation.target.id === this.target.id) {
                return true;
            }
        }
        return false;
    }
    *values() {
        yield* this.relations.model;
        yield* this.relations.deployment;
    }
    mergeWith(other) {
        if (Array.isArray(other)) {
            return other.reduce((acc, o) => acc.mergeWith(o), this);
        }
        invariant(this.source.id === other.source.id, 'Cannot merge connections with different sources');
        invariant(this.target.id === other.target.id, 'Cannot merge connections with different targets');
        return new DeploymentConnectionModel(this.source, this.target, this.relations.union(other.relations));
    }
    difference(other) {
        return new DeploymentConnectionModel(this.source, this.target, this.relations.difference(other.relations));
    }
    intersect(other) {
        return new DeploymentConnectionModel(this.source, this.target, this.relations.intersect(other.relations));
    }
    equals(other) {
        invariant(other instanceof DeploymentConnectionModel, 'Other should ne DeploymentConnectionModel');
        return this.id === other.id
            && this.source.id === other.source.id
            && this.target.id === other.target.id
            && equals(this.relations.model, other.relations.model)
            && equals(this.relations.deployment, other.relations.deployment);
    }
    /**
     * Creates a clone of the current `DeploymentConnectionModel` instance with optional overrides.
     * if `null` is provided in overrides, the corresponding relation set will be empty.
     */
    update(overrides) {
        if (overrides) {
            overrides = {
                model: this.relations.model,
                deployment: this.relations.deployment,
                ...overrides,
            };
        }
        return new DeploymentConnectionModel(this.source, this.target, overrides
            ? new RelationshipsAccum(overrides.model ?? new Set(), overrides.deployment ?? new Set())
            : this.relations);
    }
}
