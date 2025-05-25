export {
  computeColorValues,
  defaultTheme,
  ElementColors,
  RelationshipColors,
} from './theme'

export {
  invariant,
  nonexhaustive,
  nonNullable,
} from './errors'

export {
  /**
   * @deprecated Use import { AnyAux } from '@likec4/core/model'
   */
  type AnyAux,
  /**
   * @deprecated Use import { Aux } from '@likec4/core/model'
   */
  type Aux,
  /**
   * @deprecated Use import { Connection } from '@likec4/core/model'
   */
  Connection,
  /**
   * @deprecated Use import { ConnectionModel } from '@likec4/core/model'
   */
  ConnectionModel,
  /**
   * @deprecated Use import { DeployedInstanceModel } from '@likec4/core/model'
   */
  DeployedInstanceModel,
  /**
   * @deprecated Use import { DeploymentConnectionModel } from '@likec4/core/model'
   */
  DeploymentConnectionModel,
  /**
   * @deprecated Use import { DeploymentElementModel } from '@likec4/core/model'
   */
  type DeploymentElementModel,
  /**
   * @deprecated Use import { DeploymentNodeModel } from '@likec4/core/model'
   */
  DeploymentNodeModel,
  /**
   * @deprecated Use import { DeploymentRelationModel } from '@likec4/core/model'
   */
  DeploymentRelationModel,
  /**
   * @deprecated Use import { EdgeModel } from '@likec4/core/model'
   */
  EdgeModel,
  /**
   * @deprecated Use import { ElementModel } from '@likec4/core/model'
   */
  ElementModel,
  /**
   * @deprecated Use import { LikeC4DeploymentModel } from '@likec4/core/model'
   */
  LikeC4DeploymentModel,
  /**
   * @deprecated Use import { LikeC4Model } from '@likec4/core/model'
   */
  LikeC4Model,
  /**
   * @deprecated Use import { LikeC4Model } from '@likec4/core/model'
   */
  LikeC4ViewModel,
  /**
   * @deprecated Use import { NodeModel } from '@likec4/core/model'
   */
  NodeModel,
  /**
   * @deprecated Use import { RelationshipModel } from '@likec4/core/model'
   */
  RelationshipModel,
} from './model'
export * from './types'

export * from './utils'

export {
  computeView,
  computeViews,
  unsafeComputeView,
} from './compute-view'

export type { ComputeViewResult } from './compute-view'
