import DefaultMap from 'mnemonist/default-map'
import { isAncestor, sortParentsFirst } from '../../utils'
import { toArray } from '../../utils/iterable'
import type { AnyCtx, CtxElement, CtxMemory } from './_types'

export function treeFromMemoryState<T extends AnyCtx>(
  memory: Pick<CtxMemory<T>, 'final' | 'elements'>,
  filter: 'all' | 'final' = 'final',
) {
  const sorted = sortParentsFirst(toArray(filter === 'final' ? memory.final : memory.elements))

  const root = new Set(sorted)
  const parents = new DefaultMap<CtxElement<T>, CtxElement<T> | null>(() => null)
  const children = sorted.reduce((acc, parent, index, all) => {
    acc.set(
      parent,
      all
        .slice(index + 1)
        .filter(e => isAncestor(parent, e))
        .map(e => {
          root.delete(e)
          return e
        })
        .reduce((acc, el) => {
          if (!acc.some(e => isAncestor(e, el))) {
            acc.push(el)
            parents.set(el, parent)
          }
          return acc
        }, [] as CtxElement<T>[]),
    )
    return acc
  }, new DefaultMap<CtxElement<T>, ReadonlyArray<CtxElement<T>>>(() => []))

  return {
    root: root as ReadonlySet<CtxElement<T>>,
    parent: (el: CtxElement<T>) => parents.get(el),
    children: (el: CtxElement<T>) => children.get(el),
  }
}
