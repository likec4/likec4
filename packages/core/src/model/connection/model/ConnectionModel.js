import { isNot } from 'remeda';
import { invariant } from '../../../utils';
import { customInspectSymbol } from '../../../utils/const';
import { ifilter, isome } from '../../../utils/iterable';
import { difference, equals, intersection, union } from '../../../utils/set';
import { stringHash } from '../../../utils/string-hash';
import { hasSameSourceTarget } from '../ops';
/**
 * Connection refers to any relationships between two elements,
 * both direct and implicit ones (between their nested elements).
 *
 * Merges relationships together to an single edge on the diagram.
 */
export class ConnectionModel {
    source;
    target;
    relations;
    id;
    constructor(source, target, relations = new Set()) {
        this.source = source;
        this.target = target;
        this.relations = relations;
        this.id = stringHash(`model:${source.id}:${target.id}`);
    }
    _boundary;
    /**
     * Common ancestor of the source and target elements.
     * Represents the boundary of the connection.
     */
    get boundary() {
        return this._boundary ??= this.source.commonAncestor(this.target);
    }
    /**
     * Human readable expression of the connection
     * Mostly used for testing and debugging
     */
    get expression() {
        return `${this.source.id} -> ${this.target.id}`;
    }
    /**
     * Returns true if only includes relations between the source and target elements.
     */
    get isDirect() {
        return this.nonEmpty() && !this.isImplicit;
    }
    /**
     * Returns true if includes relations between nested elements of the source and target elements.
     */
    get isImplicit() {
        return this.nonEmpty() && isome(this.relations, isNot(hasSameSourceTarget(this)));
    }
    get directRelations() {
        return new Set(ifilter(this.relations, hasSameSourceTarget(this)));
    }
    nonEmpty() {
        return this.relations.size > 0;
    }
    mergeWith(other) {
        invariant(this.source.id === other.source.id, 'Cannot merge connections with different sources');
        invariant(this.target.id === other.target.id, 'Cannot merge connections with different targets');
        return new ConnectionModel(this.source, this.target, union(this.relations, other.relations));
    }
    difference(other) {
        return new ConnectionModel(this.source, this.target, difference(this.relations, other.relations));
    }
    intersect(other) {
        invariant(other instanceof ConnectionModel, 'Cannot intersect connection with different type');
        return new ConnectionModel(this.source, this.target, intersection(this.relations, other.relations));
    }
    equals(other) {
        invariant(other instanceof ConnectionModel, 'Cannot merge connection with different type');
        const _other = other;
        return this.id === _other.id
            && this.source.id === _other.source.id
            && this.target.id === _other.target.id
            && equals(this.relations, _other.relations);
    }
    /**
     * Returns a new instance with the updated relations.
     *
     * @param relations - A readonly set of `RelationshipModel` instances representing the new relations.
     * @returns A new `ConnectionModel` instance with the updated relations.
     */
    update(relations) {
        return new ConnectionModel(this.source, this.target, relations);
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
            value: ConnectionModel,
            enumerable: false,
        });
        return asString;
    }
    toString() {
        return [
            this.expression,
            this.relations.size ? '  relations:' : '  relations: [ ]',
            ...[...this.relations].map(c => '    ' + c.expression),
        ].join('\n');
    }
    /**
     * Creates a new connection with reversed direction (target becomes source and vice versa)
     */
    reversed() {
        return new ConnectionModel(this.target, this.source);
    }
}
