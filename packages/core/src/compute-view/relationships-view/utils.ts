import { nonNullable } from '../../errors'
import type { ElementModel } from '../../model/ElementModel'
import type { Fqn } from '../../types'
import { isAncestor, isDescendantOf, sortParentsFirst } from '../../utils/fqn'
import { DefaultMap } from '../../utils/mnemonist'

export function treeFromElements(elements: Iterable<ElementModel>) {
  const sorted = sortParentsFirst([...elements]) as ReadonlyArray<ElementModel>
  const root = new Set(sorted)
  const map = new Map(sorted.map(e => [e.id, e]))
  const parents = new DefaultMap<ElementModel, ElementModel | null>(() => null)
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
        }, [] as ElementModel[]),
    )
    return acc
  }, new DefaultMap<ElementModel, ElementModel[]>(() => []))

  return {
    sorted,
    byId: (id: string) => nonNullable(map.get(id as Fqn), `Element not found by id: ${id}`),
    root: root as ReadonlySet<ElementModel>,
    parent: (el: ElementModel) => parents.get(el),
    children: (el: ElementModel): ReadonlyArray<ElementModel> => children.get(el),
  }
}
