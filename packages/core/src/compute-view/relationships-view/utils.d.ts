import type { ElementModel } from '../../model/ElementModel';
import type { AnyAux, aux } from '../../types';
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
export declare function treeFromElements<M extends AnyAux>(elements: Iterable<ElementModel<M>>): Readonly<{
    /**
     * Elements sorted in a way that parents go before their descendants.
     */
    sorted: ReadonlyArray<ElementModel<M>>;
    /**
     * Get element by its id (FQN)
     */
    byId(id: aux.ElementId<M>): ElementModel<M>;
    /**
     * Root elements (i.e. those without parents)
     */
    root: ReadonlySet<ElementModel<M>>;
    /**
     * Get parent element or null if it's a root
     */
    parent(el: aux.ElementId<M> | ElementModel<M>): ElementModel<M> | null;
    /**
     * Get child elements (i.e. direct descendants)
     */
    children(el: aux.ElementId<M> | ElementModel<M>): ReadonlyArray<ElementModel<M>>;
    /**
     * Flattens the tree structure by removing redundant hierarchy levels.
     * @example
     *   A
     *   └── B
     *       ├── C
     *       │   └── D
     *       │       └── E
     *       └── F
     *           └── G
     * becomes
     *   A
     *   ├── C
     *   │   └── E
     *   └── F
     *       └── G
     */
    flatten(): ReadonlySet<ElementModel<M>>;
}>;
