import { dropWhile, forEach, pipe, take, zip } from 'remeda';
import { modelConnection } from '../../../model';
import { ModelExpression } from '../../../types';
import { difference, isAncestor, isIterable } from '../../../utils';
import { toArray } from '../../../utils/iterable';
import { AbstractStageInclude } from '../../memory';
const { findConnection, findConnectionsBetween } = modelConnection;
export class StageInclude extends AbstractStageInclude {
    /**
     * Connects elements with existing ones in the memory
     */
    connectWithExisting(elements, direction = 'both') {
        const before = this._connections.length;
        const hasChanged = () => this._connections.length > before;
        if (!isIterable(elements)) {
            if (direction === 'in' || direction === 'both') {
                for (const el of this.memory.elements) {
                    this.addConnections(findConnection(el, elements, 'directed'));
                }
            }
            if (direction === 'out' || direction === 'both') {
                this.addConnections(findConnectionsBetween(elements, this.memory.elements, 'directed'));
            }
            return hasChanged();
        }
        const targets = [...elements];
        if (direction === 'in' || direction === 'both') {
            for (const el of this.memory.elements) {
                this.addConnections(findConnectionsBetween(el, targets, 'directed'));
            }
        }
        if (direction === 'out' || direction === 'both') {
            for (const el of targets) {
                this.addConnections(findConnectionsBetween(el, this.memory.elements, 'directed'));
            }
        }
        return hasChanged();
    }
    addImplicitWithinScope(element) {
        if (!element) {
            return;
        }
        if (!this.memory.scope || isAncestor(this.memory.scope, element)) {
            this.addImplicit(element);
        }
    }
    processConnections(connections) {
        if (ModelExpression.isRelationExpr(this.expression)) {
            return connections;
        }
        pipe(connections, forEach(({ source, target, boundary }) => {
            pipe(zip([...toArray(source.ancestors()).reverse(), source], [...toArray(target.ancestors()).reverse(), target]), 
            // Filter out common ancestors
            dropWhile(([sourceAncestor, targetAncestor]) => sourceAncestor === targetAncestor), take(1), forEach(([sourceAncestor, targetAncestor]) => {
                if (sourceAncestor === source && targetAncestor === target) {
                    this.addImplicitWithinScope(boundary);
                    return;
                }
                if (sourceAncestor !== source) {
                    this.addImplicitWithinScope(sourceAncestor);
                }
                if (targetAncestor !== target) {
                    this.addImplicitWithinScope(targetAncestor);
                }
            }));
        }));
        return connections;
    }
    postcommit(state) {
        const newExplicits = difference(state.explicits, this.memory.explicits);
        for (const explicit of newExplicits) {
            state.explicitFirstSeenIn.set(explicit, '@root');
        }
        return state;
    }
}
export class ActiveGroupStageInclude extends StageInclude {
    memory;
    expression;
    constructor(memory, expression) {
        super(memory, expression);
        this.memory = memory;
        this.expression = expression;
    }
    postcommit(state) {
        const newExplicits = difference(state.explicits, this.memory.explicits);
        for (const explicit of newExplicits) {
            state.explicitFirstSeenIn.set(explicit, this.memory.activeGroupId);
        }
        for (const implicit of [...this.explicits, ...this.implicits]) {
            state.lastSeenIn.set(implicit, this.memory.activeGroupId);
        }
        return state;
    }
}
