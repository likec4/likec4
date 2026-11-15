import type { ProjectId } from '@likec4/core/types'
import { Emitter, URI } from 'langium'
import { vi } from 'vitest'
import type { LikeC4LangiumDocument } from '../ast'
import type {
  DependencyInstaller,
  DependencyInstallResult,
  DependencyState,
  DidChangeDependencyStates,
  GitDependencySource,
} from '../dependencies'
import { createTestServices, mockMethod } from '../test'
import { externalProjectId } from '../workspace/ExternalProjects'

/**
 * Test fixtures for git dependencies: fake states (the producer is not in this package) and a fake installer.
 */

export const billingSource: GitDependencySource = { git: 'git@github.com:my-org/billing.git', ref: 'main' }

const billingInstance = { repository: 'github.com/my-org/billing', sha: 'a'.repeat(40), subdir: '' }

export function notInstalled(consumer: string, name = 'billing'): DependencyState {
  return { status: 'not-installed', consumer: consumer as ProjectId, name, source: billingSource }
}

export function unsupported(consumer: string, name = 'billing'): DependencyState {
  return { status: 'unsupported', consumer: consumer as ProjectId, name, source: billingSource }
}

export function installed(consumer: string, name = 'billing', filesWithErrors = 0): DependencyState {
  return {
    status: 'installed',
    consumer: consumer as ProjectId,
    name,
    source: billingSource,
    instance: billingInstance,
    projectId: externalProjectId('billing'),
    filesWithErrors,
  }
}

export const installedResult: DependencyInstallResult = {
  status: 'installed',
  instance: billingInstance,
  files: 1,
  cached: false,
}

/**
 * Promise with external resolve
 */
export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => {
    resolve = r
  })
  return { promise, resolve }
}

/**
 * Workspace with the provider project `billing` (resolved by name, as if its instance is registered)
 * and the consumer project `consumer` that imports from it.
 * The states of git dependencies and the installer are fakes controlled by the test.
 */
export async function gitDependencyWorkspace(options?: {
  install?: DependencyInstaller['install']
  /**
   * Whether the installer is supported by the host
   * @default true
   */
  supported?: boolean
  /**
   * Register the provider project `billing`, so the import name resolves.
   * Without it the name does not resolve, as for a git dependency that is not installed.
   * @default true
   */
  provider?: boolean
  /**
   * Model of the consumer document
   */
  consumerModel?: string
}) {
  const install = vi.fn<DependencyInstaller['install']>(options?.install ?? (() => Promise.resolve(installedResult)))
  const installer: DependencyInstaller = {
    supported: options?.supported ?? true,
    install: (source, opts) => install(source, opts),
  }
  const t = createTestServices({
    context: {
      dependencyInstaller: () => installer,
    },
  })
  await t.initialize()
  const { services } = t
  const shared = services.shared

  // Fake states
  const states = new Map<string, DependencyState>()
  const key = (consumer: string, name: string) => `${consumer}\0${name}`
  mockMethod(shared.dependencies.States, 'get', (consumer, name) => states.get(key(consumer, name)))
  mockMethod(
    shared.dependencies.States,
    'all',
    consumer => [...states.values()].filter(s => consumer === undefined || s.consumer === consumer),
  )
  // The emitter is protected: the producer fires it, here the test plays the producer
  const emitter: unknown = Reflect.get(shared.dependencies.States, 'onDidChangeEmitter')
  if (!(emitter instanceof Emitter)) {
    throw new Error('DependencyStates has no onDidChangeEmitter')
  }
  const fire = (event: DidChangeDependencyStates) => emitter.fire(event)

  /**
   * Sets the state (and fires the change, unless `silent`)
   */
  const setState = (state: DependencyState, silent = false) => {
    states.set(key(state.consumer, state.name), state)
    if (!silent) {
      fire({ consumers: [state.consumer] })
    }
  }

  // Sync of external projects: the producer of states marks installed dependencies (states change after sync)
  const sync = mockMethod(shared.workspace.WorkspaceManager, 'syncExternalProjects', () => {
    for (const state of Array.from(states.values())) {
      if (state.status === 'not-installed' && install.mock.calls.some(([source]) => source.git === state.source.git)) {
        setState(installed(state.consumer, state.name))
      }
    }
    return Promise.resolve()
  })

  const projectsManager = shared.workspace.ProjectsManager
  if (options?.provider !== false) {
    await projectsManager.registerProject({
      config: { name: 'billing' },
      folderUri: URI.parse('file:///test/workspace/src/billing'),
    })
    await t.addDocument(
      `
      specification {
        element component
      }
      model {
        component c1
      }
    `,
      'billing/model.c4',
    )
  }
  await projectsManager.registerProject({
    config: { name: 'consumer' },
    folderUri: URI.parse('file:///test/workspace/src/consumer'),
  })
  const consumer: LikeC4LangiumDocument = await t.addDocument(
    options?.consumerModel ?? `import c1 from 'billing'`,
    'consumer/model.c4',
  )

  return {
    ...t,
    consumer,
    install,
    sync,
    setState,
    fire,
  }
}
