import { keys, pluck } from 'rambdax'
import type { Fqn, Relation } from '../types';
import { compareFqnHierarchically } from '../utils'
import type { ComputedEdge, EdgeId } from './types'
import { pipe, A, O} from '@mobily/ts-belt'

const pluckId: <T extends { id: any }>(list: T[]) => T['id'][] = pluck('id')

interface ResolvedRelationsObj {
  [source: Fqn]: {
    [target: Fqn]: Relation[]
  }
}

export class EdgeBuilder {

  private _relationsObj: ResolvedRelationsObj = {}

  add(source: Fqn, target: Fqn, relation: Relation) {
    const bySource = this._relationsObj[source] ?? {}
    const relations = bySource[target] ?? []
    relations.push(relation)
    bySource[target] = relations
    this._relationsObj[source] = bySource
    return this
  }

  build(): ComputedEdge[] {
    return keys(this._relationsObj).sort(compareFqnHierarchically).reverse().flatMap(source => {
      const targets = this._relationsObj[source] ?? {}
      return keys(targets).sort(compareFqnHierarchically).reverse().map(target => {
        const relations = targets[target] ?? []
        const titles = pipe(
          relations,
          A.filterMap(r => O.fromPredicate(r.title, v => v !== '')),
        )
        const label = titles.length === 1 ? titles[0]! : null
        return {
          id: `${source}:${target}` as EdgeId,
          source,
          target,
          label,
          relations: pluckId(relations)
        } satisfies ComputedEdge
      })
    })
  }

}
