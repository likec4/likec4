import { dropWhile, forEach, pipe, take, zip } from 'remeda';
import { isIterable } from '../../../utils';
import { toArray } from '../../../utils/iterable';
import { AbstractStageInclude } from '../../memory';
import { cleanCrossBoundary, cleanRedundantRelationships } from '../clean-connections';
import { findConnection, findConnectionsBetween } from '../utils';
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
    processConnections(connections) {
        const clean = pipe(connections, cleanCrossBoundary, cleanRedundantRelationships);
        pipe(clean, 
        // Process only connection from this stage
        // filter(c => this._connections.some(c2 => c2.id === c.id)),
        forEach(({ source, target, boundary }) => {
            pipe(zip([...toArray(source.ancestors()).reverse(), source], [...toArray(target.ancestors()).reverse(), target]), 
            // Filter out common ancestors
            dropWhile(([sourceAncestor, targetAncestor]) => sourceAncestor === targetAncestor), take(1), forEach(([sourceAncestor, targetAncestor]) => {
                if (source === sourceAncestor && target === targetAncestor) {
                    this.addImplicit(boundary);
                    return;
                }
                if (sourceAncestor !== source && sourceAncestor.isDeploymentNode() && !sourceAncestor.onlyOneInstance()) {
                    // state.final.add(source)
                    this.addImplicit(sourceAncestor);
                }
                if (targetAncestor !== target && targetAncestor.isDeploymentNode() && !targetAncestor.onlyOneInstance()) {
                    // state.final.add(source)
                    this.addImplicit(targetAncestor);
                }
            }));
        }));
        return clean;
    }
}
