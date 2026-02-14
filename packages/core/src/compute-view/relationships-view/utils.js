import { drop, filter, once, pipe, reduce } from 'remeda';
import { nonNullable } from '../../utils';
import { isAncestor, isDescendantOf, sortParentsFirst } from '../../utils/fqn';
import { DefaultMap } from '../../utils/mnemonist';
/**
 * Builds a tree structure from a flat list of elements.
 * @param elements - An iterable of ElementModel instances.
 * @returns An object containing the sorted elements, a lookup by ID, root elements, parent and children accessors, and a flatten method.
 * @example
 * ```ts
 * const elements = [
 *   { id: 'A' },
 *   { id: 'A.B' },
 *   { id: 'A.B.C' },
 *   { id: 'A.B.D' },
 *   { id: 'E' },
 * ]
 *
 * const tree = treeFromElements(elements)
 *
 * tree.sorted.map(e => e.id) // ['A', 'A.B', 'A.B.C', 'A.B.D', 'E']
 *
 * tree.byId('A.B').id // 'A.B'
 *
 * [...tree.root].map(e => e.id) // ['A', 'E']
 *
 * tree.parent(tree.byId('A.B.C'))?.id // 'A.B'
 *
 * tree.children(tree.byId('A')).map(e => e.id) // ['A.B']
 */
export function treeFromElements(elements) {
    const sorted = sortParentsFirst([...elements]);
    const root = new Set(sorted);
    // Indexes for quick lookup
    const lookup = new Map();
    // Map of element id to its parent element (or null if it's a root)
    const parents = new DefaultMap(() => null);
    // Map of element id to its child elements
    const children = sorted.reduce((acc, parent, i, all) => {
        lookup.set(parent.id, parent);
        acc.set(parent.id, pipe(all, drop(i + 1), filter(isDescendantOf(parent)), reduce((children, el) => {
            root.delete(el);
            // Only direct children should be added,
            // so we check that the element is not a descendant
            // of any already added child
            if (!children.some(isAncestor(el))) {
                children.push(el);
                parents.set(el.id, parent);
            }
            return children;
        }, [])));
        return acc;
    }, new DefaultMap(() => []));
    return {
        sorted,
        byId: (id) => nonNullable(lookup.get(id), `Element not found by id: ${id}`),
        root,
        parent: (el) => parents.get(typeof el === 'string' ? el : el.id),
        children: (el) => children.get(typeof el === 'string' ? el : el.id),
        flatten: once(() => {
            return new Set([
                ...root,
                ...sorted.reduce((acc, el) => {
                    const _children = children.get(el.id);
                    if (_children.length === 0) {
                        acc.push(el);
                        return acc;
                    }
                    if (_children.length > 1) {
                        acc.push(..._children);
                    }
                    return acc;
                }, []),
            ]);
        }),
    };
}
