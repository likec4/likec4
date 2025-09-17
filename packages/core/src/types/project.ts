import type { PartialDeep, WritableDeep } from 'type-fest'
import type { LikeC4StyleDefaults, LikeC4Theme } from '../styles/types'
import * as scalar from './scalar'

export type LikeC4ProjectTheme = PartialDeep<WritableDeep<LikeC4Theme>, {
  recurseIntoArrays: false
  allowUndefinedInNonTupleArrays: false
}>

export interface LikeC4ProjectStylesConfig {
  theme?: LikeC4ProjectTheme | undefined
  defaults?: PartialDeep<LikeC4StyleDefaults> | undefined
}

/**
 * Configuration of the project, as read from the config file.
 * LikeC4 projects encapsulate models, and can import from each other
 */
export interface LikeC4Project {
  /**
   * ID of the project, casted to {@link scalar.ProjectId}
   */
  readonly id: scalar.ProjectId

  title?: string

  /**
   * Custom styles
   */
  styles?: LikeC4ProjectStylesConfig | undefined
}
