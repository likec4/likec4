import type { ProjectId } from '@likec4/core/types'
import { type Event, Disposable, Emitter } from 'langium'
import type { LikeC4SharedServices } from '../module'
import { ADisposable } from '../utils'
import type { DependencyState } from './types'

/**
 * Event of {@link DependencyStates.onDidChange}
 */
export interface DidChangeDependencyStates {
  /**
   * Consumer projects whose dependency states changed
   */
  consumers: ReadonlyArray<ProjectId>
}

/**
 * States of git dependencies of consumer projects.
 *
 * Owned by the producer of states (git instances in external projects): it computes states
 * and fires {@link onDidChange}. Diagnostics and code actions only read them with {@link get} and {@link all}.
 *
 * Synchronous: answers from memory (registered instances and the result of the last sync of external projects),
 * so validation can use it.
 */
export class DependencyStates extends ADisposable {
  protected readonly onDidChangeEmitter: Emitter<DidChangeDependencyStates>

  constructor(protected services: LikeC4SharedServices) {
    super()
    this.onDidChangeEmitter = new Emitter<DidChangeDependencyStates>()
    this.onDispose(
      Disposable.create(() => this.onDidChangeEmitter.dispose()),
    )
  }

  /**
   * Fires when states of dependencies of consumer projects change (e.g. after install or sync),
   * so documents of the consumers can be revalidated.
   * Never fires yet: states are computed by the producer of git instances.
   */
  get onDidChange(): Event<DidChangeDependencyStates> {
    return this.onDidChangeEmitter.event
  }

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
