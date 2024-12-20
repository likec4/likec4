import { isDeepEqual } from 'remeda'
import { type DeploymentConnectionModel, differenceConnections } from '../../../model/connection'
import type { DeploymentElementModel } from '../../../model/DeploymentElementModel'
import type { AnyAux } from '../../../model/types'
import type { ExpressionV2 } from '../../../types'
import { difference as differenceSet } from '../../../utils'
import { customInspectSymbol } from '../../../utils/const'
import { toArray } from '../../../utils/iterable'
import { AbstractMemory, type ComputeCtx, type StageExpression } from '../../memory'
import { StageExclude } from '../stages/stage-exclude'
import { StageInclude } from '../stages/stage-include'

export type Ctx = ComputeCtx<
  DeploymentElementModel<AnyAux>,
  DeploymentConnectionModel<AnyAux>,
  Memory,
  StageInclude,
  StageExclude,
  ExpressionV2
>

export class Memory extends AbstractMemory<Ctx> {
  static empty(): Memory {
    return new Memory({
      elements: new Set(),
      explicits: new Set(),
      final: new Set(),
      connections: [],
    })
  }

  override stageInclude(expr: StageExpression<Ctx>): StageInclude {
    return new StageInclude(this, expr)
  }
  override stageExclude(expr: StageExpression<Ctx>): StageExclude {
    return new StageExclude(this, expr)
  }

  override mutableState(): Ctx['MutableState'] {
    return ({
      elements: new Set(this.state.elements),
      explicits: new Set(this.state.explicits),
      final: new Set(this.state.final),
      connections: [...this.state.connections],
    })
  }

  override update(newstate: Partial<Ctx['MutableState']>): Memory {
    return new Memory({
      ...this.state,
      ...newstate,
    })
  }

  equals(other: unknown): boolean {
    return other instanceof Memory && isDeepEqual(this.state, other.state)
  }

  diff(state: Memory) {
    const current = this
    return {
      added: {
        elements: toArray(differenceSet(state.elements, current.elements)),
        explicits: toArray(differenceSet(state.explicits, current.explicits)),
        final: toArray(differenceSet(state.final, current.final)),
        connections: toArray(differenceConnections(state.connections, current.connections)),
      },
      removed: {
        elements: toArray(differenceSet(current.elements, state.elements)),
        explicits: toArray(differenceSet(current.explicits, state.explicits)),
        final: toArray(differenceSet(current.final, state.final)),
        connections: differenceConnections(current.connections, state.connections),
      },
    }
  }

  public override toString(): string {
    return [
      'final:',
      ...[...this.final].map(e => '  ' + e.id),
      'connections:',
      ...this.connections.map(c => '  ' + c.expression),
    ].join('\n')
  }

  [customInspectSymbol](_depth: unknown, _inspectOptions: unknown, _inspect: unknown) {
    const asString = this.toString()

    // // Trick so that node displays the name of the constructor
    // Object.defineProperty(asString, 'constructor', {
    //   value: this.constructor,
    //   enumerable: false,
    // })

    return asString
  }
}
