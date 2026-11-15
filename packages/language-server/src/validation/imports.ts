import type { ProjectId } from '@likec4/core/types'
import { type LangiumDocument, type ValidationAcceptor, type ValidationCheck, AstUtils, DocumentState } from 'langium'
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
    tracker.validated(doc, projectId)
    const state = states.get(projectId, el.project)
    if (state && checkDependencyState(el, state, accept)) {
      return
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
 * Remembers the dependency states the diagnostics of each document were computed with
 */
interface DependencyStatesTracker {
  /**
   * Called when imports of the document are validated with the current states of its consumer project
   */
  validated(document: LangiumDocument, consumer: ProjectId): void
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
 * changed (e.g. after install, or a status change that the sync of external projects does not relink),
 * so diagnostics on imports follow the states:
 * - every validated document with imports records the snapshot of the states of its consumer;
 * - on change, documents whose recorded snapshot differs from the current one are revalidated,
 *   and their snapshot is set to the current one first (repeated events without changes do nothing);
 * - changes are batched and applied after the running sync of external projects (which may have fired them);
 * - waits for running builds (read-lock), then relinks under the write-lock;
 *   if the write is cancelled before it starts, the consumers are queued again.
 *
 * Snapshots of deleted documents are dropped. Subscriptions are disposed with `DependencyStates`.
 */
function dependencyStatesTracker(shared: LikeC4SharedServices): DependencyStatesTracker {
  const existing = trackers.get(shared)
  if (existing) {
    return existing
  }
  const states = shared.dependencies.States
  // Document URI -> consumer and snapshot of states its imports were validated with
  const seen = new Map<string, { consumer: ProjectId; snapshot: string }>()
  const pending = new Set<ProjectId>()
  let scheduled = false

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

  /**
   * Validated documents of the consumers, whose recorded snapshot differs from the current states.
   * Sets their snapshot to the current one.
   */
  const takeOutdated = (consumers: ReadonlySet<ProjectId>): LangiumDocument[] => {
    const current = new Map<ProjectId, string>()
    const snapshotOf = (consumer: ProjectId) => {
      let snapshot = current.get(consumer)
      if (snapshot === undefined) {
        snapshot = statesSnapshot(states.all(consumer))
        current.set(consumer, snapshot)
      }
      return snapshot
    }
    const lookup = shared.workspace.ProjectsLookup
    const outdated = [] as LangiumDocument[]
    for (const doc of shared.workspace.LangiumDocuments.all) {
      // Documents that are not validated yet are validated (and recorded) by the running build
      if (!isLikeC4UserDocument(doc) || doc.state < DocumentState.Validated) {
        continue
      }
      const recorded = seen.get(doc.uri.toString())
      if (!recorded || !consumers.has(recorded.consumer) || lookup.isExcluded(doc)) {
        continue
      }
      const consumer = lookup.ownerProjectId(doc)
      const snapshot = snapshotOf(consumer)
      if (consumer === recorded.consumer && recorded.snapshot === snapshot) {
        continue
      }
      seen.set(doc.uri.toString(), { consumer, snapshot })
      outdated.push(doc)
    }
    return outdated
  }

  const revalidate = async () => {
    const lock = shared.workspace.WorkspaceLock
    // Let running builds complete, instead of cancelling them
    await lock.read(() => undefined)
    scheduled = false
    const consumers = new Set(pending)
    pending.clear()
    const builder = shared.workspace.DocumentBuilder
    await lock.write(async token => {
      if (token.isCancellationRequested) {
        // Superseded by another write before anything was reset: try again after it
        consumers.forEach(c => pending.add(c))
        schedule()
        return
      }
      const documents = takeOutdated(consumers)
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
    shared.workspace.DocumentBuilder.onUpdate((_changed, deleted) => {
      for (const uri of deleted) {
        seen.delete(uri.toString())
      }
    }),
  )

  const tracker: DependencyStatesTracker = {
    validated(document, consumer) {
      seen.set(document.uri.toString(), { consumer, snapshot: statesSnapshot(states.all(consumer)) })
    },
  }
  trackers.set(shared, tracker)
  return tracker
}
