import { nonNullable } from '../../errors'
import type { ElementModel } from '../../model/ElementModel'
import type { AnyAux, Aux, aux } from '../../types'
import { isAncestor, isDescendantOf, sortParentsFirst } from '../../utils/fqn'
import { DefaultMap } from '../../utils/mnemonist'

export function treeFromElements<M extends AnyAux>(elements: Iterable<ElementModel<M>>) {
  const sorted = sortParentsFirst([...elements]) as ReadonlyArray<ElementModel<M>>
  const root = new Set(sorted)
  const map = new Map(sorted.map(e => [e._literalId, e]))
  const parents = new DefaultMap<ElementModel<M>, ElementModel<M> | null>(() => null)
  const children = sorted.reduce((acc, parent, index, all) => {
    acc.set(
      parent,
      all
        .slice(index + 1)
        .filter(isDescendantOf(parent))
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
        }, [] as ElementModel<M>[]),
    )
    return acc
  }, new DefaultMap<ElementModel<M>, ElementModel<M>[]>(() => []))

  return {
    sorted,
    byId: (id: aux.ElementId<M>): ElementModel<M> => nonNullable(map.get(id), `Element not found by id: ${id}`),
    root: root as ReadonlySet<ElementModel<M>>,
    parent: (el: ElementModel<M>): ElementModel<M> | null => parents.get(el),
    children: (el: ElementModel<M>): ReadonlyArray<ElementModel<M>> => children.get(el),
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
    flatten: (): Set<ElementModel<M>> => {
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
        }, [] as ElementModel<M>[]),
      ])
    },
  }
}
