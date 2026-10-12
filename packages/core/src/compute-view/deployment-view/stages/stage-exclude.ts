import { difference } from '../../../utils'
import { AbstractStageExclude } from '../../memory'
import type { Ctx } from '../memory/memory'

export class StageExclude extends AbstractStageExclude<Ctx> {
  protected override postcommit(state: Ctx['MutableState']) {
    for (const element of difference(this.memory.explicits, state.explicits)) {
      state.explicitFirstSeenIn.delete(element)
    }
    for (const element of difference(this.memory.elements, state.elements)) {
      state.lastSeenIn.delete(element)
    }
    return state
  }
}
