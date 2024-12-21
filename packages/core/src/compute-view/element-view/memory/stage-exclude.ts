import { filter, forEach, pipe } from 'remeda'
import type { RelationshipModel } from '../../../model/RelationModel'
import { difference, hasIntersection, intersection } from '../../../utils/set'
import { AbstractStageExclude, type MutableState, type StageExpression } from '../../memory'
import { type ActiveGroupCtx, type ActiveGroupMemory, type Ctx } from './memory'

export class StageExclude<C extends Ctx = Ctx> extends AbstractStageExclude<C> {
  public excludeRelations(excluded: ReadonlySet<RelationshipModel<any>>): this {
    pipe(
      this.memory.connections,
      filter(c => hasIntersection(c.relations, excluded)),
      forEach(c => {
        this.excludeConnections(
          c.update(intersection(c.relations, excluded)),
        )
      }),
    )
    return this
  }

  /**
   * Precommit hook
   */
  protected override precommit(state: MutableState<C>): MutableState<C> {
    if (this.excluded.elements.size > 0) {
      const excludeRelationships = new Set(
        [...this.excluded.elements].flatMap(el => [
          ...el.incoming('direct'),
          ...el.outgoing('direct'),
        ]),
      )
      this.excludeRelations(excludeRelationships)
    }
    return state
  }

  protected override postcommit(state: C['MutableState']) {
    const leftExplicits = difference(this.memory.explicits, state.explicits)
    for (const explicit of leftExplicits) {
      state.explicitFirstSeenIn.delete(explicit)
    }

    // Left elements
    const left = difference(this.memory.elements, state.elements)
    for (const el of left) {
      state.lastSeenIn.delete(el)
    }
    return state
  }
}

export class ActiveGroupStageExclude extends StageExclude {
  constructor(
    public override readonly memory: ActiveGroupMemory,
    public override readonly expression: StageExpression<ActiveGroupCtx>,
  ) {
    super(memory, expression)
  }
}
