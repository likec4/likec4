import type { AnyAux, aux } from '../../types'
import { nonNullable } from '../../utils'
import { isAncestor, isDescendantOf, sortParentsFirst } from '../../utils/fqn'
import { DefaultMap } from '../../utils/mnemonist'

type Elt<T extends AnyAux> = { id: aux.ElementId<T>; _literalId: string }

export function treeFromElements<M extends AnyAux, E extends Elt<M>>(elements: Iterable<E>) {
  const sorted = sortParentsFirst([...elements]) as ReadonlyArray<E>
  const root = new Set(sorted)
  const map = new Map(sorted.map(e => [e._literalId, e]))
  const parents = new DefaultMap<E, E | null>(() => null)
  const children = sorted.reduce((acc, parent, index, all) => {
    acc.set(
      parent,
      all
        .slice(index + 1)
        .filter(isDescendantOf<aux.ElementId<M>>(parent))
        .map(e => {
          root.delete(e)
          return e
        })
        .reduce((acc, el) => {
          if (!acc.some(isAncestor(el))) {
            acc.push(el)
            parents.set(el, parent)
          }
          return acc
        }, [] as E[]),
    )
    return acc
  }, new DefaultMap<E, E[]>(() => []))

  return {
    sorted,
    byId: (id: aux.ElementId<M>): E => nonNullable(map.get(id), `Element not found by id: ${id}`),
    root: root as ReadonlySet<E>,
    parent: (el: E): E | null => parents.get(el),
    children: (el: E): ReadonlyArray<E> => children.get(el),
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
    flatten: (): Set<E> => {
      return new Set([
        ...root,
        ...sorted.reduce((acc, el) => {
          const _children = children.get(el)
          if (_children.length === 0) {
            acc.push(el)
            return acc
          }
          if (_children.length > 1) {
            acc.push(..._children)
          }
          return acc
        }, [] as E[]),
      ])
    },
  }
}
