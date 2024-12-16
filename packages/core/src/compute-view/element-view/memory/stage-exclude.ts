import { filter, forEach, pipe } from 'remeda'
import type { RelationshipModel } from '../../../model/RelationModel'
import { difference, hasIntersection, intersection } from '../../../utils/set'
import { AbstractStageExclude } from '../../memory'
import { type ActiveGroupMemory, type Ctx, Memory } from './memory'
import { StageInclude } from './stage-include'

type Elem = Ctx['Element']
type Connection = Ctx['Connection']

export class StageExclude<C extends Ctx = Ctx> extends AbstractStageExclude<C> {
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

  protected override postcommit(state: C['MutableState']) {
    const leftExplicits = difference(this.memory.explicits, state.explicits)
    if (leftExplicits.size > 0) {
      state.rootGroup.excludeElement(...leftExplicits)
      state.groups.forEach(group => {
        group.excludeElement(...leftExplicits)
      })
    }

    const leftImplicits = [...difference(this.memory.elements, state.elements)]
    if (leftImplicits.length > 0) {
      state.rootGroup.excludeImplicit(leftImplicits)
      state.groups.forEach(group => {
        group.excludeImplicit(leftImplicits)
      })
    }
    return state
  }
}
export class ActiveGroupStageExclude extends StageExclude {
  constructor(
    public override readonly memory: ActiveGroupMemory
  ) {
    super(memory)
  }
}
