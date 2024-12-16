import type { DeploymentConnectionModel } from '../../../model/connection'
import type { DeploymentElementModel } from '../../../model/DeploymentElementModel'
import type { AnyAux } from '../../../model/types'
import { AbstractMemory, type ComputeCtx } from '../../memory'
import { StageExclude } from './stage-exclude'
import { StageInclude } from './stage-include'

export type Ctx = ComputeCtx<
  DeploymentElementModel<AnyAux>,
  DeploymentConnectionModel<AnyAux>,
  Memory,
  StageInclude,
  StageExclude
>

export class Memory extends AbstractMemory<Ctx> {
  static empty(): Memory {
    return new Memory({
      elements: new Set(),
      explicits: new Set(),
      final: new Set(),
      connections: []
    })
  }

  override clone(): Memory {
    return new Memory({
      elements: new Set(this.state.elements),
      explicits: new Set(this.state.explicits),
      final: new Set(this.state.final),
      connections: [...this.state.connections]
    })
  }
  override stageInclude(): StageInclude {
    return new StageInclude(this)
  }
  override stageExclude(): StageExclude {
    return new StageExclude(this)
  }

  override update(newstate: Partial<Ctx['MutableState']>): Memory {
    return new Memory({
      ...this.state,
      ...newstate
    })
  }
}
