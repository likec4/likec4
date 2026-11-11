import type { PartialDeep, WritableDeep } from 'type-fest'
import type { LikeC4StyleDefaults, LikeC4Theme } from '../styles/types'
import type { ProjectId } from './scalar'

export type LikeC4ProjectTheme = PartialDeep<WritableDeep<LikeC4Theme>, {
  recurseIntoArrays: false
  allowUndefinedInNonTupleArrays: false
}>

export type LikeC4ProjectStyleDefaults = PartialDeep<WritableDeep<LikeC4StyleDefaults>, {
  recurseIntoArrays: false
  allowUndefinedInNonTupleArrays: false
}>

export interface LikeC4ProjectStylesCustomStylesheets {
  /**
   * List of paths to CSS files, relative to the project root
   * (available in LSP, but not in dumped JSON)
   */
  paths?: string[]
  /**
   * Merged CSS
   */
  content: string
}

export interface LikeC4ProjectStylesConfig {
  theme?: LikeC4ProjectTheme
  defaults?: LikeC4ProjectStyleDefaults
  customCss?: LikeC4ProjectStylesCustomStylesheets
}

export interface LikeC4ProjectManualLayoutsConfig {
  outDir: string
}

/**
 * Configuration of the project, as read from the config file.
 * LikeC4 projects encapsulate models, and can import from each other
 */
export interface LikeC4Project {
  /**
   * ID of the project, casted to {@link ProjectId}
   */
  readonly id: ProjectId

  /**
   * Title of the project
   */
  title?: string

  /**
   * Contact person/team responsible for the project
   */
  contactPerson?: string

  /**
   * Additional metadata (from config)
   */
  metadata?: Record<string, unknown>

  /**
   * Custom styles
   */
  styles?: LikeC4ProjectStylesConfig | undefined

  /**
   * Configuration for manual layouts snapshots
   */
  manualLayouts?: LikeC4ProjectManualLayoutsConfig | undefined

  /**
   * Automatically derive element technology from icon name
   * when technology is not explicitly set.
   * Applies to aws:, azure:, gcp:, and tech: icons; generic bootstrap: and md: icons are excluded.
   * Defaults to true.
   */
  inferTechnologyFromIcon?: boolean | undefined
}

/**
 * Where an imported project comes from, as seen by the importing (consumer) project.
 * - `workspace` - another project of the same workspace; `projectId` is its real id
 * - `local` - a dependency declared in the consumer config by a local path
 */
export type ImportedProjectSource =
  | {
    kind: 'workspace'
    /**
     * Real id of the workspace project (may differ from the import name,
     * e.g. when the project id got a unique suffix)
     */
    projectId: ProjectId
  }
  | {
    kind: 'local'
    /**
     * Path as written in the `dependencies` section of the consumer config,
     * relative to the consumer project folder
     */
    path: string
  }

/**
 * Metadata of a project imported by the model (`import ... from 'name'`).
 * Stored in model data next to `imports`, keyed by the import name
 * (the name written by the consumer).
 */
export interface ImportedProjectMeta {
  /**
   * Original name of the imported project (from its own config)
   */
  name: string
  /**
   * Where the imported project comes from
   */
  source: ImportedProjectSource
}
