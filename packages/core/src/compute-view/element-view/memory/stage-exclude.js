import { filter, forEach, pipe } from 'remeda';
import { difference, hasIntersection, intersection } from '../../../utils/set';
import { AbstractStageExclude } from '../../memory';
export class StageExclude extends AbstractStageExclude {
    excludeRelations(excluded) {
        pipe(this.memory.connections, filter(c => hasIntersection(c.relations, excluded)), forEach(c => {
            this.excludeConnections(c.update(intersection(c.relations, excluded)));
        }));
        return this;
    }
    /**
     * Precommit hook
     */
    precommit(state) {
        if (this.excluded.elements.size > 0) {
            const excludeRelationships = new Set([...this.excluded.elements].flatMap(el => [
                ...el.incoming('direct'),
                ...el.outgoing('direct'),
            ]));
            this.excludeRelations(excludeRelationships);
        }
        return state;
    }
    postcommit(state) {
        const leftExplicits = difference(this.memory.explicits, state.explicits);
        for (const explicit of leftExplicits) {
            state.explicitFirstSeenIn.delete(explicit);
        }
        // Left elements
        const left = difference(this.memory.elements, state.elements);
        for (const el of left) {
            state.lastSeenIn.delete(el);
        }
        return state;
    }
}
export class ActiveGroupStageExclude extends StageExclude {
    memory;
    expression;
    constructor(memory, expression) {
        super(memory, expression);
        this.memory = memory;
        this.expression = expression;
    }
}
