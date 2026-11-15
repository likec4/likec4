import { parseGitRepositoryUrl } from '@likec4/config'
import { DiffId, Fqn, nonNullable, ProjectId } from '@likec4/core'
import { type ExecuteCommandAcceptor, AbstractExecuteCommandHandler } from 'langium/lsp'
import type { WorkDoneProgressReporter } from 'vscode-languageserver'
import type { DependencyInstallResult, DependencyState, GitDependencySource } from '../dependencies/types'
import { logger as rootLogger } from '../logger'
import type { ApplyEditsResult, ModelEditRequest } from '../model-diff'
import type { LikeC4Services, LikeC4SharedServices } from '../module'
import { InstallDependencies } from '../protocol'
import { normalizeGitSubdir } from '../workspace/dependency-uri'

const logger = rootLogger.getChild('commands')

/**
 * Commands executed by the language server (sent by code actions).
 * Arguments: `[projectId, fqn]` or `[projectId, diffId]`.
 */
export const LikeC4Commands = {
  PreviewRemovalImpact: 'likec4.lsp.preview-removal-impact',
  SafeDelete: 'likec4.lsp.safe-delete',
  ApplyDiff: 'likec4.lsp.apply-diff',
  DiscardDiff: 'likec4.lsp.discard-diff',
} as const

/**
 * Messages and progress of the client, used by command handlers
 * (the window of the LSP connection, absent when there is no connection, e.g. tests and CLI)
 */
export interface CommandsWindow {
  showErrorMessage(message: string): unknown
  showWarningMessage(message: string): unknown
  showInformationMessage(message: string): unknown
  createWorkDoneProgress(): Promise<WorkDoneProgressReporter>
}

function isLikeC4Services(services: object): services is LikeC4Services {
  return 'likec4' in services
}

function readArgs(args: unknown[]): [ProjectId, string] {
  const [projectId, id] = args
  if (typeof projectId !== 'string' || typeof id !== 'string') {
    throw new Error(`Invalid command arguments: ${JSON.stringify(args)}`)
  }
  return [projectId as ProjectId, id]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/**
 * Reads optional `[params]` of {@link InstallDependencies.command}
 *
 * @throws if the params are not a plain object with expected fields
 */
function readInstallParams(args: unknown[]): InstallDependencies.Params {
  const [params] = args
  if (params === undefined || params === null) {
    return {}
  }
  const invalid = () => new Error(`Invalid command arguments: ${JSON.stringify(args)}`)
  if (!isPlainObject(params)) {
    throw invalid()
  }
  const { projectId, name, update } = params
  if (
    (projectId !== undefined && typeof projectId !== 'string')
    || (name !== undefined && typeof name !== 'string')
    || (update !== undefined && typeof update !== 'boolean')
  ) {
    throw invalid()
  }
  return {
    ...(projectId !== undefined && { projectId: ProjectId(projectId) }),
    ...(name !== undefined && { name }),
    ...(update === true && { update }),
  }
}

/**
 * Key of a git source: installs of the same source are serialized
 * (repository identity, ref and normalized subdirectory)
 */
function installKey(source: GitDependencySource): string {
  const repository = parseGitRepositoryUrl(source.git)?.id ?? source.git.trim()
  let subdir: string
  try {
    subdir = normalizeGitSubdir(source.path)
  } catch {
    // Invalid subdirectory: the installer reports it, any key works
    subdir = source.path ?? ''
  }
  return JSON.stringify([repository, source.ref, subdir])
}

/**
 * Install of a source, see {@link LikeC4ExecuteCommandHandler.installDependencies}
 */
interface RunningInstall {
  promise: Promise<DependencyInstallResult>
  update: boolean
  /**
   * Call of the command that started the install
   */
  owner: object
  /**
   * Resolves when the owner call has passed the result to external projects (or failed)
   */
  settled: Promise<void>
  settle: () => void
  /**
   * Dependency names whose result is already shown to the user (a joined call does not repeat them)
   */
  reported: Set<string>
}

/**
 * Result of a dependency install within a call of the command
 */
type InstallOutcome =
  & InstallDependencies.Res['results'][number]
  & {
    /**
     * Install the result comes from, undefined for a dependency installed before the call
     */
    install: RunningInstall | undefined
  }

/**
 * Formats names as `'a', 'b'`
 */
function quoteNames(names: Iterable<string>): string {
  return [...new Set(names)].map(name => `'${name}'`).join(', ')
}

/**
 * Runs the commands of code actions: removal impact preview, safe delete, apply and discard diff,
 * and the install of git dependencies ({@link InstallDependencies}).
 */
export class LikeC4ExecuteCommandHandler extends AbstractExecuteCommandHandler {
  /**
   * Last requested install by source (see {@link installKey}): later requests join or follow it
   */
  #installs = new Map<string, RunningInstall>()

  constructor(private shared: LikeC4SharedServices) {
    super()
  }

  /**
   * Window of the client, undefined without connection
   */
  protected get window(): CommandsWindow | undefined {
    return this.shared.lsp.Connection?.window
  }

  private get services(): LikeC4Services {
    return nonNullable(this.shared.ServiceRegistry.all.find(isLikeC4Services), 'LikeC4 services are not registered')
  }

  override registerCommands(acceptor: ExecuteCommandAcceptor): void {
    acceptor(LikeC4Commands.PreviewRemovalImpact, async args => {
      const [projectId, fqn] = readArgs(args)
      await this.services.Rpc.requestRemovalImpact({ projectId, fqn: Fqn(fqn) })
    })
    const edit = (command: string, label: string, toRequest: (id: string) => ModelEditRequest) =>
      acceptor(command, async args => {
        const [projectId, id] = readArgs(args)
        const result = await this.services.likec4.ModelEdits.apply(toRequest(id), { projectId })
        this.report(label, result)
        return result
      })
    edit(LikeC4Commands.SafeDelete, 'Safe delete', fqn => ({ type: 'safe-delete', targets: [fqn] }))
    edit(LikeC4Commands.ApplyDiff, 'Apply diff', id => ({ type: 'apply-diff', diffId: DiffId(id), action: 'apply' }))
    edit(
      LikeC4Commands.DiscardDiff,
      'Discard diff',
      id => ({ type: 'apply-diff', diffId: DiffId(id), action: 'discard' }),
    )
    acceptor(InstallDependencies.command, args => this.installDependencies(readInstallParams(args)))
  }

  /**
   * Installs git dependencies of the consumer project (of all projects if not specified),
   * then passes installed instances to external projects (registers them and relinks consumers).
   *
   * - Without `update`, dependencies that are already installed are skipped (reported as cached).
   * - Git and network run outside of the workspace write-lock, the lock is taken only by the sync
   *   of external projects, which runs only if this call installed something.
   * - Installs of the same source are serialized: a request joins the running install of the source,
   *   an `update` request that arrives during an install without `update` runs after it.
   *   So concurrent calls run the installer once per source. A call that only joined installs of other calls
   *   shows no progress and does not sync: it waits until the owner calls have synced.
   * - Each dependency name is reported to the user once per install.
   * - Never throws for failed installs: they are reported to the user and returned in the result.
   */
  async installDependencies(params: InstallDependencies.Params = {}): Promise<InstallDependencies.Res> {
    const update = params.update === true
    const states = this.shared.dependencies.States.all(params.projectId)
      .filter(state => params.name === undefined || state.name === params.name)
    if (states.length === 0) {
      logger.debug`no git dependencies to install`
      return { results: [] }
    }
    const installer = this.shared.dependencies.Installer
    if (!installer.supported) {
      this.window?.showErrorMessage(
        'LikeC4: Remote dependencies are not supported in this environment. Use VS Code desktop or the LikeC4 CLI.',
      )
      return { results: states.map(state => this.toResult(state, { status: 'unsupported' })) }
    }

    // Identity of this call: installs it starts are owned by it
    const call = {}
    const started = states.map(state => ({
      state,
      install: !update && state.status === 'installed' ? undefined : this.install(state.source, update, call),
    }))
    const owned = new Set(started.flatMap(({ install }) => install?.owner === call ? [install] : []))
    const joined = new Set(started.flatMap(({ install }) => install && install.owner !== call ? [install] : []))

    const progress = owned.size > 0 ? await this.beginProgress(owned.size) : undefined
    let completed = 0
    const outcomes: InstallOutcome[] = []
    try {
      await Promise.all([...owned].map(async install => {
        await install.promise
        completed++
        progress?.report(Math.round(completed / owned.size * 100), `${completed}/${owned.size}`)
      }))
      for (const { state, install } of started) {
        const result = install ? await install.promise : this.alreadyInstalled(state)
        outcomes.push({ ...this.toResult(state, result), install })
      }
      if (outcomes.some(o => o.install?.owner === call && o.result.status === 'installed')) {
        progress?.report('Loading dependencies')
        // Registers installed instances and relinks consumers (takes the write-lock itself)
        await this.shared.workspace.WorkspaceManager.syncExternalProjects('reread')
      }
    } finally {
      progress?.done()
      owned.forEach(install => install.settle())
    }
    // Installs of other calls: wait until they are passed to external projects
    await Promise.all([...joined].map(install => install.settled))

    this.reportInstall(outcomes)
    return { results: outcomes.map(({ projectId, name, result }) => ({ projectId, name, result })) }
  }

  /**
   * Returns the running install of the source to join, or starts a new one
   * (after the running one, if this is an `update` and the running one is not).
   */
  private install(source: GitDependencySource, update: boolean, call: object): RunningInstall {
    const key = installKey(source)
    const running = this.#installs.get(key)
    if (running && (running.update || !update)) {
      return running
    }
    const installer = this.shared.dependencies.Installer
    const run = () =>
      installer.install(source, { update })
        .catch((error: unknown): DependencyInstallResult => ({
          // The installer never throws by the contract, but be defensive
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        }))
    let settle = () => {}
    const settled = new Promise<void>(resolve => {
      settle = resolve
    })
    const entry: RunningInstall = {
      promise: running ? running.promise.then(run, run) : run(),
      update,
      owner: call,
      settled,
      settle,
      reported: new Set(),
    }
    this.#installs.set(key, entry)
    void entry.promise.finally(() => {
      if (this.#installs.get(key) === entry) {
        this.#installs.delete(key)
      }
    })
    return entry
  }

  /**
   * Result for a dependency that is installed already.
   * `files` is the number of loaded documents of the registered instance (0 if it is not registered).
   */
  private alreadyInstalled(state: DependencyState): DependencyInstallResult {
    if (state.status !== 'installed') {
      return { status: 'failed', error: `Dependency '${state.name}' is not installed` }
    }
    return {
      status: 'installed',
      instance: state.instance,
      files: this.shared.workspace.ExternalProjects.get(state.projectId)?.files.size ?? 0,
      cached: true,
    }
  }

  private toResult(
    state: DependencyState,
    result: DependencyInstallResult,
  ): InstallDependencies.Res['results'][number] {
    return { projectId: state.consumer, name: state.name, result }
  }

  private async beginProgress(total: number): Promise<WorkDoneProgressReporter | undefined> {
    const window = this.window
    if (!window) {
      return undefined
    }
    try {
      const progress = await window.createWorkDoneProgress()
      progress.begin(
        total === 1 ? 'LikeC4: Installing dependency' : 'LikeC4: Installing dependencies',
        0,
        `0/${total}`,
      )
      return progress
    } catch (error) {
      logger.debug('Failed to create work done progress', { error })
      return undefined
    }
  }

  /**
   * Shows the result. A dependency name is reported once per install (calls that joined it do not repeat it).
   */
  private reportInstall(outcomes: ReadonlyArray<InstallOutcome>) {
    const window = this.window
    const installed = [] as string[]
    const already = [] as string[]
    for (const { projectId, name, result, install } of outcomes) {
      if (!install) {
        already.push(name)
        continue
      }
      if (install.reported.has(name)) {
        continue
      }
      install.reported.add(name)
      switch (result.status) {
        case 'installed':
          installed.push(name)
          break
        case 'failed':
          logger.warn`failed to install dependency ${name} of ${projectId}: ${result.error}`
          window?.showErrorMessage(`LikeC4: Failed to install dependency '${name}': ${result.error}`)
          break
        case 'unsupported':
          window?.showErrorMessage(
            `LikeC4: Dependency '${name}' cannot be installed: remote dependencies are not supported in this environment`,
          )
          break
      }
    }
    const messages = [
      ...(installed.length > 0 ? [`installed ${quoteNames(installed)}`] : []),
      ...(already.length > 0 ? [`already installed ${quoteNames(already)}`] : []),
    ]
    if (messages.length > 0) {
      window?.showInformationMessage(`LikeC4: ${messages.join('; ')}`)
    }
  }

  private report(action: string, { error, remaining }: ApplyEditsResult) {
    const window = this.window
    switch (true) {
      case !!error:
        logger.warn`${action} failed: ${error}`
        window?.showWarningMessage(`LikeC4: ${action} failed: ${error}`)
        break
      case remaining.length > 0:
        window?.showWarningMessage(`LikeC4: ${action} left ${remaining.length} error(s) to fix manually`)
        break
    }
  }
}
