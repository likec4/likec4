import type { ProjectId } from '@likec4/core/types'
import type { LikeC4SharedServices } from '../module'
import type { DependencyState } from './types'

/**
 * States of git dependencies of consumer projects.
 *
 * Synchronous: answers from memory (registered instances and the result of the last sync of external projects),
 * so validation can use it.
 */
export class DependencyStates {
  constructor(protected services: LikeC4SharedServices) {}

  /**
   * State of the dependency `name` of the consumer project.
   *
   * @param consumer - id of the project that imports
   * @param name - import name as written in `from '…'` (key of the `dependencies` section)
   * @returns undefined if the name is not a git dependency of the consumer
   */
  get(_consumer: ProjectId, _name: string): DependencyState | undefined {
    // Git dependencies are not accepted by the config yet
    return undefined
  }

  /**
   * States of all git dependencies of the consumer project (of all projects if not specified).
   */
  all(_consumer?: ProjectId): DependencyState[] {
    return []
  }
}
