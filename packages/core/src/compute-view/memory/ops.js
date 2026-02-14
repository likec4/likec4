import { Connection } from '../../model';
import { isAncestor, sortParentsFirst } from '../../utils';
import { toArray } from '../../utils/iterable';
import { DefaultMap } from '../../utils/mnemonist';
export function treeFromMemoryState(memory, filter = 'final') {
    const sorted = sortParentsFirst(toArray(filter === 'final' ? memory.final : memory.elements));
    const connected = new Set(memory.connections.flatMap(c => [c.source, c.target]));
    const root = new Set(sorted);
    const parents = new DefaultMap(() => null);
    const children = sorted.reduce((acc, parent, index, all) => {
        acc.set(parent, all
            .slice(index + 1)
            .filter(e => isAncestor(parent, e))
            .map(e => {
            root.delete(e);
            return e;
        })
            .reduce((acc, el) => {
            if (!acc.some(e => isAncestor(e, el))) {
                acc.push(el);
                parents.set(el, parent);
            }
            return acc;
        }, []));
        return acc;
    }, new DefaultMap(() => []));
    return {
        root: root,
        connected: connected,
        hasInOut: (el) => memory.connections.some(Connection.isAnyInOut(el.id)),
        parent: (el) => parents.get(el),
        children: (el) => children.get(el),
    };
}
