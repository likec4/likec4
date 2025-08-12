import * as scalar from './scalar'

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
}
