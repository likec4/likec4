import { keys, pluck } from 'rambdax'
import type { Fqn, Relation } from '../types'
import type { ComputedEdge, EdgeId } from '../types/computed-view'
import { commonAncestor } from '../utils/fqn'
import { compareRelations } from '../utils/relations'

type ResolvedRelationsObj = Record<Fqn, Record<Fqn, Relation[]>>

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
    return keys(this._relationsObj)
      .flatMap(source => {
        const targets = this._relationsObj[source] ?? {}
        return keys(targets).map(target => {
          const relations = (targets[target] ?? []).sort(compareRelations)
          const label = relations.find(r => r.title !== '')?.title ?? null
          return {
            id: `${source}:${target}` as EdgeId,
            parent: commonAncestor(source, target),
            source,
            target,
            label,
            relations: pluck('id', relations)
          } satisfies ComputedEdge
        })
      })
      .sort(compareRelations)
      .reverse()
  }
}
