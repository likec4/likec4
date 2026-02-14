import { forEach, only, pipe } from 'remeda';
import { isAncestor, sortByFqnHierarchically } from '../../../utils/fqn';
import { isome, toArray } from '../../../utils/iterable';
import { difference, union } from '../../../utils/set';
import { treeFromMemoryState } from '../../memory/ops';
import { findRedundantConnections } from '../clean-connections';
export class StageFinal {
    memory;
    static for(memory) {
        return new StageFinal(memory);
    }
    constructor(memory) {
        this.memory = memory;
    }
    step1CleanConnections(memory) {
        if (memory.connections.length < 2) {
            return memory;
        }
        const connectionsToExclude = findRedundantConnections(memory.connections);
        if (connectionsToExclude.length === 0) {
            return memory;
        }
        const stage = memory.stageExclude({});
        stage.excludeConnections(connectionsToExclude, true);
        return stage.commit();
    }
    step2ProcessImplicits(memory) {
        const implicits = union(this.memory.elements, memory.elements);
        const final = union(memory.final, this.memory.explicits);
        const snapshot = new Set(final);
        const isFinalOrHasIncludedDescendant = (el) => {
            for (const final of snapshot) {
                if (el === final || isAncestor(el, final)) {
                    return true;
                }
            }
            return false;
        };
        // Pick from implicit elements
        pipe(difference(implicits, snapshot), toArray(), sortByFqnHierarchically, forEach((el) => {
            // if (memory.scope && !memory.scope.isAncestorOf(el)) {
            //   return
            // }
            // If element has more 2 or more children included
            // It can "box" around
            const childrensToWrap = [...el.children()].filter(isFinalOrHasIncludedDescendant).length;
            if (childrensToWrap >= 2) {
                final.add(el);
                return;
            }
            // If Element has only one child included
            // and has "similar" sibling with included descendant
            if (childrensToWrap === 1 && isome(el.siblings(), isFinalOrHasIncludedDescendant)) {
                final.add(el);
            }
        }));
        return memory.update({ final });
    }
    step3ProcessBoundaries(memory) {
        const boundaries = new Set();
        for (const conn of memory.connections) {
            if (conn.boundary && conn.boundary !== conn.source && conn.boundary !== conn.target) {
                boundaries.add(conn.boundary);
            }
        }
        const tree = treeFromMemoryState(memory, 'final');
        const stage = memory.stageExclude({});
        const isRemovable = (el) => !(boundaries.has(el)
            || memory.explicits.has(el)
            || tree.hasInOut(el)
            || tree.root.has(el));
        const singleRoot = only([...tree.root]);
        if (singleRoot && !memory.explicits.has(singleRoot)) {
            stage.exclude(singleRoot);
        }
        for (const el of memory.final) {
            const singleChild = only(tree.children(el));
            if (singleChild && !tree.hasInOut(singleChild) && isRemovable(el)) {
                stage.exclude(el);
            }
        }
        if (stage.isDirty()) {
            return stage.commit();
        }
        return memory;
    }
    commit() {
        // return []
        const step1 = this.step1CleanConnections(this.memory);
        const step2 = this.step2ProcessImplicits(step1);
        return this.step3ProcessBoundaries(step2);
        // return step2memory
        // const step3m?emory = this.step3FlatNodes(step2memory)
        // return step3memory
    }
}
