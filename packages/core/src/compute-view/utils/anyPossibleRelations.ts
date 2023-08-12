import { prop, uniqBy } from 'rambdax'
import type { Element } from '../../types'
import { compareByFqnHierarchically, isAncestor } from '../../utils/fqn'

export function* anyPossibleRelations(
  elements: Element[]
): Generator<[source: Element, target: Element]> {
  const uniqElements = uniqBy(prop('id'), elements).sort(compareByFqnHierarchically).reverse()
  for (const source of uniqElements) {
    for (const target of uniqElements) {
      if (source !== target && !isAncestor(source, target) && !isAncestor(target, source)) {
        yield [source, target]
      }
    }
  }
}
