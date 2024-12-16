import { filter, forEach, pipe } from 'remeda'
import type { RelationshipModel } from '../../../model/RelationModel'
import { hasIntersection, intersection } from '../../../utils/set'
import { AbstractStageExclude } from '../../memory'
import { type Ctx, Memory } from './memory'

type Elem = Ctx['Element']
type Connection = Ctx['Connection']

export class StageExclude extends AbstractStageExclude<Ctx> {
  public excludeRelations(excluded: ReadonlySet<RelationshipModel<any>>): this {
    pipe(
      this.memory.connections,
      filter(c => hasIntersection(c.relations, excluded)),
      forEach(c => {
        this.excludeConnections(
          c.updateRelations(intersection(c.relations, excluded))
        )
      })
    )
    return this
  }
}
