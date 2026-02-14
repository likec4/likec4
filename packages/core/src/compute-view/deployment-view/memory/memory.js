import { isDeepEqual } from 'remeda';
import { differenceConnections } from '../../../model';
import { difference as differenceSet } from '../../../utils';
import { customInspectSymbol } from '../../../utils/const';
import { toArray } from '../../../utils/iterable';
import { AbstractMemory } from '../../memory';
import { StageExclude } from '../stages/stage-exclude';
import { StageInclude } from '../stages/stage-include';
export class Memory extends AbstractMemory {
    static empty() {
        return new Memory({
            elements: new Set(),
            explicits: new Set(),
            final: new Set(),
            connections: [],
        });
    }
    stageInclude(expr) {
        return new StageInclude(this, expr);
    }
    stageExclude(expr) {
        return new StageExclude(this, expr);
    }
    mutableState() {
        return ({
            elements: new Set(this.state.elements),
            explicits: new Set(this.state.explicits),
            final: new Set(this.state.final),
            connections: [...this.state.connections],
        });
    }
    update(newstate) {
        return new Memory({
            ...this.state,
            ...newstate,
        });
    }
    equals(other) {
        return other instanceof Memory && isDeepEqual(this.state, other.state);
    }
    diff(state) {
        return {
            added: {
                elements: toArray(differenceSet(state.elements, this.elements)),
                explicits: toArray(differenceSet(state.explicits, this.explicits)),
                final: toArray(differenceSet(state.final, this.final)),
                connections: toArray(differenceConnections(state.connections, this.connections)),
            },
            removed: {
                elements: toArray(differenceSet(this.elements, state.elements)),
                explicits: toArray(differenceSet(this.explicits, state.explicits)),
                final: toArray(differenceSet(this.final, state.final)),
                connections: differenceConnections(this.connections, state.connections),
            },
        };
    }
    toString() {
        return [
            'final:',
            ...[...this.final].map(e => '  ' + e.id),
            'connections:',
            ...this.connections.map(c => '  ' + c.expression),
        ].join('\n');
    }
    [customInspectSymbol](_depth, _inspectOptions, _inspect) {
        const asString = this.toString();
        // // Trick so that node displays the name of the constructor
        // Object.defineProperty(asString, 'constructor', {
        //   value: this.constructor,
        //   enumerable: false,
        // })
        return asString;
    }
}
