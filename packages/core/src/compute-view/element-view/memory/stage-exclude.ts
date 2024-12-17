import { filter, forEach, map, pipe } from 'remeda'
import type { RelationshipModel } from '../../../model/RelationModel'
import { difference, hasIntersection, intersection } from '../../../utils/set'
import { AbstractStageExclude } from '../../memory'
import { type ActiveGroupMemory, type Ctx } from './memory'

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
    for (const explicit of leftExplicits) {
      state.explicitFirstSeenIn.delete(explicit.id)
    }

    // Left elements
    const left = difference(this.memory.elements, state.elements)
    for (const el of left) {
      state.lastSeenIn.delete(el.id)
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
