import { partition } from 'remeda';
import { mergeConnections } from '../../model';
import { intersection, isIterable, union } from '../../utils';
export class AbstractStageInclude {
    memory;
    expression;
    // New elements
    explicits = new Set();
    implicits = new Set();
    // Ordered Set of explicit and implicit elements
    _ordered = new Set();
    _connections = [];
    constructor(memory, expression) {
        this.memory = memory;
        this.expression = expression;
    }
    get elements() {
        return this.explicits;
    }
    /**
     * Connections from this stage
     */
    get connections() {
        return this._connections;
    }
    mergedConnections() {
        return mergeConnections([
            ...this.memory.connections,
            ...this._connections,
        ]);
    }
    connectWithExisting(_element, _direction) {
        throw new Error('Method not implements, depends on the model');
    }
    /**
     * Possible to override
     */
    _addExplicit(elements) {
        this._ordered.add(elements);
        this.explicits.add(elements);
        this.implicits.delete(elements);
    }
    addExplicit(element) {
        if (!element) {
            return this;
        }
        if (isIterable(element)) {
            for (const el of element) {
                this._addExplicit(el);
            }
            return this;
        }
        this._addExplicit(element);
        return this;
    }
    /**
     * Possible to override
     */
    _addImplicit(elements) {
        if (this.explicits.has(elements)) {
            return;
        }
        this._ordered.add(elements);
        this.implicits.add(elements);
    }
    addImplicit(elements) {
        if (!elements) {
            return this;
        }
        if (isIterable(elements)) {
            for (const el of elements) {
                this._addImplicit(el);
            }
            return this;
        }
        this._addImplicit(elements);
        return this;
    }
    /**
     * Possible to override
     */
    _addConnection(connection) {
        this._connections.push(connection);
        this._addImplicit(connection.source);
        this._addImplicit(connection.target);
    }
    addConnections(connection) {
        if (isIterable(connection)) {
            for (const c of connection) {
                this._addConnection(c);
            }
            return this;
        }
        this._addConnection(connection);
        return this;
    }
    isDirty() {
        return this.explicits.size > 0 || this.implicits.size > 0 || this._connections.length > 0;
    }
    isEmpty() {
        return !this.isDirty();
    }
    /**
     * Precommit hook
     */
    precommit(state) {
        return state;
    }
    /**
     * Postcommit hook
     */
    postcommit(state) {
        return state;
    }
    processConnections(connections) {
        return connections;
    }
    commit() {
        let state = this.precommit(this.memory.mutableState());
        let fromConnections = new Set();
        if (this._connections.length > 0) {
            // To preserve order, we split new connections into two sets
            // First are outgoing from known elements (in memory.elements)
            const [fromKnown, rest] = partition(this._connections, c => state.final.has(c.source));
            state.connections = this.processConnections(mergeConnections([
                ...state.connections,
                ...fromKnown,
                ...rest,
            ]));
            fromConnections = new Set(state.connections.flatMap(c => [c.source, c.target]));
        }
        state.elements = union(state.elements, this._ordered, this.explicits, fromConnections, this.implicits);
        state.explicits = intersection(state.elements, union(state.explicits, this.explicits));
        state.final = intersection(state.elements, union(state.final, this.explicits, fromConnections));
        return this.memory.update(this.postcommit(state));
    }
}
