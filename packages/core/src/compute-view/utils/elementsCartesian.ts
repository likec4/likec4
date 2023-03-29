import type { Element, Fqn } from '../../types'
import { compareFqnHierarchically, isAncestor } from '../../utils/fqn'
import { uniq } from 'rambdax'

export function* elementsCartesian(elements: Element[]): Generator<[source: Fqn, target: Fqn]> {
  const fnqns = uniq(elements.map(e => e.id)).sort(compareFqnHierarchically).reverse()
  for (const source of fnqns) {
    for (const target of fnqns) {
      if (source !== target && !isAncestor(source, target) && !isAncestor(target, source)) {
        yield [source, target]
      }
    }
  }
}
