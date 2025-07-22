import type { DeploymentElementModel } from '../../model'
import type { ElementModel } from '../../model/ElementModel'
import type { AnyAux, aux, DeploymentFqn, Fqn } from '../../types'
import { nonNullable } from '../../utils'
import { isAncestor, isDescendantOf, sortParentsFirst } from '../../utils/fqn'
import { DefaultMap } from '../../utils/mnemonist'

type Element<T extends AnyAux> = ElementModel<T> | DeploymentElementModel<T>

export function treeFromElements<M extends AnyAux>(elements: Iterable<Element<M>>) {
  const sorted = sortParentsFirst([...elements]) as ReadonlyArray<Element<M>>
  const root = new Set(sorted)
  const map = new Map(sorted.map(e => [e._literalId, e]))
  const parents = new DefaultMap<Element<M>, Element<M> | null>(() => null)
  const children = sorted.reduce((acc, parent, index, all) => {
    acc.set(
      parent,
      all
        .slice(index + 1)
        .filter(isDescendantOf<Fqn | DeploymentFqn>(parent))
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
        }, [] as Element<M>[]),
    )
    return acc
  }, new DefaultMap<Element<M>, Element<M>[]>(() => []))

  return {
    sorted,
    byId: (id: aux.ElementId<M>): Element<M> => nonNullable(map.get(id), `Element not found by id: ${id}`),
    root: root as ReadonlySet<Element<M>>,
    parent: (el: Element<M>): Element<M> | null => parents.get(el),
    children: (el: Element<M>): ReadonlyArray<Element<M>> => children.get(el),
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
    flatten: (): Set<Element<M>> => {
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
        }, [] as Element<M>[]),
      ])
    },
  }
}
