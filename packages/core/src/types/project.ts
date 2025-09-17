import type { PartialDeep } from 'type-fest'
import * as scalar from './scalar'
import type { DefaultStyleValues, LikeC4Theme } from './styles'

export type LikeC4ProjectTheme = Pick<LikeC4Theme, 'colors' | 'sizes' | 'spacing' | 'textSizes'>

export interface LikeC4ProjectStylesConfig {
  theme: LikeC4ProjectTheme
  defaults: DefaultStyleValues
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
  styles?: PartialDeep<LikeC4ProjectStylesConfig> | undefined
}
