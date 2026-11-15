import type { ProjectId } from '@likec4/core/types'
import { type ValidationAcceptor, type ValidationCheck, AstUtils, DocumentState } from 'langium'
import { type ast, isLikeC4UserDocument } from '../ast'
import type { DependencyState } from '../dependencies/types'
import { logger as rootLogger } from '../logger'
import type { LikeC4Services, LikeC4SharedServices } from '../module'
import { projectIdFrom } from '../utils'
import { tryOrLog } from './_shared'

const { getDocument } = AstUtils

const logger = rootLogger.getChild('dependencies')

/**
 * Codes of diagnostics reported on `import … from 'name'` when the name is a git dependency of the consumer
 * (see `DependencyStates`). Local dependencies and workspace projects get no such diagnostics.
 *
 * - `likec4-dependency-not-installed` (error): the dependency is not installed.
 *   Has a quick fix that runs the `likec4.lsp.install-dependencies` command;
 *   the diagnostic `data` is {@link DependencyDiagnosticData}.
 * - `likec4-dependency-parse-errors` (warning): the installed dependency has documents with parse errors;
 *   one warning with the number of such documents.
 * - `likec4-dependency-unsupported` (error): the host cannot load git dependencies (e.g. browser).
 */
export const DependencyDiagnosticCodes = {
  NotInstalled: 'likec4-dependency-not-installed',
  ParseErrors: 'likec4-dependency-parse-errors',
  Unsupported: 'likec4-dependency-unsupported',
} as const

export type DependencyDiagnosticCode = typeof DependencyDiagnosticCodes[keyof typeof DependencyDiagnosticCodes]

/**
 * Data of the `likec4-dependency-not-installed` diagnostic: arguments of the install command
 */
export interface DependencyDiagnosticData {
  /**
   * Consumer project
   */
  projectId: ProjectId
  /**
   * Import name, as written in `from '…'`
   */
  name: string
}

/**
 * Checks if the value is {@link DependencyDiagnosticData} (diagnostic data comes back from the client)
 */
export function isDependencyDiagnosticData(value: unknown): value is DependencyDiagnosticData {
  return typeof value === 'object'
    && value !== null
    && 'projectId' in value
    && typeof value.projectId === 'string'
    && 'name' in value
    && typeof value.name === 'string'
}

/**
 * Reports the state of a git dependency on the import.
 *
 * @returns true if the dependency cannot be used in this state (other checks of the import are skipped)
 */
function checkDependencyState(
  el: ast.ImportsFromPoject,
  state: DependencyState,
  accept: ValidationAcceptor,
): boolean {
  const name = state.name
  switch (state.status) {
    case 'not-installed': {
      const data: DependencyDiagnosticData = { projectId: state.consumer, name }
      accept('error', `Dependency '${name}' is not installed. Run the quick fix or \`likec4 install\`.`, {
        node: el,
        property: 'project',
        code: DependencyDiagnosticCodes.NotInstalled,
        data,
      })
      return true
    }
    case 'unsupported': {
      accept(
        'error',
        `Dependency '${name}' cannot be loaded: remote dependencies are not supported in this environment. Use VS Code desktop or the LikeC4 CLI.`,
        {
          node: el,
          property: 'project',
          code: DependencyDiagnosticCodes.Unsupported,
        },
      )
      return true
    }
    case 'installed': {
      if (state.filesWithErrors > 0) {
        const files = state.filesWithErrors === 1 ? '1 file' : `${state.filesWithErrors} files`
        accept(
          'warning',
          `Dependency '${name}' has ${files} with parse errors, its model may be incomplete. Check the version of the dependency or run \`likec4 update ${name}\`.`,
          {
            node: el,
            property: 'project',
            code: DependencyDiagnosticCodes.ParseErrors,
          },
        )
      }
      return false
    }
  }
}

export const checkImportsFromPoject = (services: LikeC4Services): ValidationCheck<ast.ImportsFromPoject> => {
  const resolver = services.shared.workspace.DependencyResolver
  const states = services.shared.dependencies.States
  const tracker = dependencyStatesTracker(services.shared)
  return tryOrLog((el, accept) => {
    const doc = getDocument(el)
    const projectId = projectIdFrom(doc)
    // Git dependency: report its state (not installed, unsupported, parse errors)
    const state = states.get(projectId, el.project)
    if (state) {
      tracker.validated(projectId)
      if (checkDependencyState(el, state, accept)) {
        return
      }
    }
    // The name is resolved via `dependencies` of the consumer project, or by the workspace project name
    const resolved = resolver.resolve(projectId, el.project)
    if (!resolved) {
      accept('error', 'Imported project not found', {
        node: el,
        property: 'project',
      })
      return
    }
    if (resolved.projectId === projectId) {
      accept('error', 'Imported project cannot be the same as the current project', {
        node: el,
        property: 'project',
      })
      return
    }
    // A `dependencies` entry named as the current project: `@name.` would clash with own elements
    if (el.project === projectId) {
      accept('error', 'Import name cannot be the same as the name of the current project', {
        node: el,
        property: 'project',
      })
      return
    }
  })
}

/**
 * Remembers the dependency states the diagnostics of each consumer were computed with
 */
interface DependencyStatesTracker {
  /**
   * Called when imports of the consumer are validated with its current states
   */
  validated(consumer: ProjectId): void
}

const trackers = new WeakMap<LikeC4SharedServices, DependencyStatesTracker>()

/**
 * Snapshot of what diagnostics depend on: status and number of files with parse errors of each dependency
 */
function statesSnapshot(states: ReadonlyArray<DependencyState>): string {
  return states
    .map(s => `${s.name}\0${s.status}\0${s.status === 'installed' ? s.filesWithErrors : ''}`)
    .sort()
    .join('\n')
}

/**
 * Returns the tracker of dependency states of the shared services, creates it on first call.
 *
 * The tracker relinks and revalidates documents with imports of consumer projects whose dependency states
 * changed (e.g. after install), so diagnostics on imports follow the states:
 * - changes are batched and applied after the running sync of external projects (which may have fired them);
 * - only consumers whose states differ from the states their diagnostics were computed with are revalidated
 *   (no build loops if the producer fires on every build);
 * - waits for running builds (read-lock), then relinks under the write-lock.
 *
 * The subscription is disposed with `DependencyStates`.
 */
function dependencyStatesTracker(shared: LikeC4SharedServices): DependencyStatesTracker {
  const existing = trackers.get(shared)
  if (existing) {
    return existing
  }
  const states = shared.dependencies.States
  // Consumer -> snapshot of states its imports were validated with
  const seen = new Map<ProjectId, string>()
  const pending = new Set<ProjectId>()
  let scheduled = false

  const changedConsumers = (candidates: Iterable<ProjectId>): Set<ProjectId> => {
    const changed = new Set<ProjectId>()
    for (const consumer of candidates) {
      const previous = seen.get(consumer)
      // Never validated with git dependency states: nothing to update, unless it has states now
      const current = statesSnapshot(states.all(consumer))
      if ((previous ?? '') !== current) {
        changed.add(consumer)
      }
    }
    return changed
  }

  const schedule = () => {
    if (scheduled || pending.size === 0) {
      return
    }
    scheduled = true
    // Not from within a running sync (it may have fired the change): taking the write-lock would cancel it
    shared.workspace.WorkspaceManager.whenExternalProjectsSynced()
      .then(revalidate)
      .catch(error => {
        logger.warn('Failed to revalidate documents after dependency states changed', { error })
      })
  }

  const revalidate = async () => {
    const lock = shared.workspace.WorkspaceLock
    // Let running builds complete, instead of cancelling them
    await lock.read(() => undefined)
    scheduled = false
    const candidates = new Set(pending)
    pending.clear()
    const lookup = shared.workspace.ProjectsLookup
    const builder = shared.workspace.DocumentBuilder
    await lock.write(async token => {
      if (token.isCancellationRequested) {
        // Superseded by another write before anything was reset: try again after it
        candidates.forEach(c => pending.add(c))
        schedule()
        return
      }
      const consumers = changedConsumers(candidates)
      if (consumers.size === 0) {
        return
      }
      const documents = shared.workspace.LangiumDocuments.all
        .filter(doc =>
          isLikeC4UserDocument(doc)
          // Documents that are not validated yet are validated by the running build
          && doc.state >= DocumentState.Validated
          && doc.parseResult.value.imports.length > 0
          && !lookup.isExcluded(doc)
          && consumers.has(lookup.ownerProjectId(doc))
        )
        .toArray()
      if (documents.length === 0) {
        return
      }
      logger.debug`relink ${documents.length} documents after dependency states changed`
      // Relink and validate without parsing again (the content did not change).
      // States are reset synchronously: if the update is cancelled, the next build validates them
      for (const doc of documents) {
        builder.resetToState(doc, DocumentState.ComputedScopes)
      }
      await builder.update([], [], token)
    })
  }

  states.onDispose(
    states.onDidChange(({ consumers }) => {
      consumers.forEach(c => pending.add(c))
      schedule()
    }),
  )

  const tracker: DependencyStatesTracker = {
    validated(consumer) {
      seen.set(consumer, statesSnapshot(states.all(consumer)))
    },
  }
  trackers.set(shared, tracker)
  return tracker
}
