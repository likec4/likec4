import type { ProjectId } from '@likec4/core/types'
import { deepEqual } from 'fast-equals'
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
 * This class is the producer: it keeps states and fires {@link onDidChange} itself, through the protected
 * `onDidChangeEmitter`. States are computed by the sync of external projects
 * (`ExternalProjects.dependencyStates`) and replaced with {@link update} at the end of each sync
 * (startup, reload of projects, `WorkspaceManager.syncExternalProjects` after install).
 * Diagnostics and code actions only read states with {@link get} and {@link all} and subscribe to {@link onDidChange}.
 *
 * Synchronous: answers from memory (the result of the last sync of external projects), so validation can use it.
 */
export class DependencyStates extends ADisposable {
  protected readonly onDidChangeEmitter: Emitter<DidChangeDependencyStates>

  /**
   * consumer -> import name -> state
   */
  #states = new Map<ProjectId, Map<string, DependencyState>>()

  /**
   * Consumers whose states changed by updates without notification (see {@link update})
   */
  #pending = new Set<ProjectId>()

  constructor(protected services: LikeC4SharedServices) {
    super()
    this.onDidChangeEmitter = new Emitter<DidChangeDependencyStates>()
    this.onDispose(
      Disposable.create(() => {
        this.onDidChangeEmitter.dispose()
        this.#states.clear()
        this.#pending.clear()
      }),
    )
  }

  /**
   * Fires when states of dependencies of consumer projects change (e.g. after install or sync),
   * so documents of the consumers can be revalidated.
   * Fired outside of the workspace write-lock.
   */
  get onDidChange(): Event<DidChangeDependencyStates> {
    return this.onDidChangeEmitter.event
  }

  /**
   * State of the dependency `name` of the consumer project.
   *
   * @param consumer - id of the project that imports
   * @param name - import name as written in `from '…'` (key of the `dependencies` section)
   * @returns undefined if the name is not a git dependency of the consumer (or dependencies are not synced yet)
   */
  get(consumer: ProjectId, name: string): DependencyState | undefined {
    return this.#states.get(consumer)?.get(name)
  }

  /**
   * States of all git dependencies of the consumer project (of all projects if not specified).
   */
  all(consumer?: ProjectId): DependencyState[] {
    if (consumer !== undefined) {
      return [...(this.#states.get(consumer)?.values() ?? [])]
    }
    return [...this.#states.values()].flatMap(byName => [...byName.values()])
  }

  /**
   * Replaces all states (producer API, called by the sync of external projects).
   *
   * Fires {@link onDidChange} with the consumers whose states changed (status, instance or `filesWithErrors`),
   * including consumers changed by previous updates with `notify: false`.
   * The sync updates states with `notify: false` under the workspace write-lock, before relinking consumers
   * (so diagnostics of that build see the new states), and fires after the lock is released.
   *
   * @returns consumers whose states changed by this update
   */
  update(states: Iterable<DependencyState>, options?: { notify?: boolean }): ProjectId[] {
    const next = new Map<ProjectId, Map<string, DependencyState>>()
    for (const state of states) {
      let byName = next.get(state.consumer)
      if (!byName) {
        byName = new Map()
        next.set(state.consumer, byName)
      }
      byName.set(state.name, state)
    }
    const consumers = [] as ProjectId[]
    for (const consumer of new Set([...this.#states.keys(), ...next.keys()])) {
      const previous = this.#states.get(consumer)
      const current = next.get(consumer)
      if (!deepEqual(previous, current)) {
        consumers.push(consumer)
      }
    }
    this.#states = next
    for (const consumer of consumers) {
      this.#pending.add(consumer)
    }
    if (options?.notify !== false && this.#pending.size > 0) {
      const changed = [...this.#pending]
      this.#pending.clear()
      this.onDidChangeEmitter.fire({ consumers: changed })
    }
    return consumers
  }
}
