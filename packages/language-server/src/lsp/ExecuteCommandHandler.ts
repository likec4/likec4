import { parseGitRepositoryUrl } from '@likec4/config'
import type { ProjectId } from '@likec4/core'
import { DiffId, Fqn, nonNullable } from '@likec4/core'
import { type ExecuteCommandAcceptor, AbstractExecuteCommandHandler } from 'langium/lsp'
import type { WorkDoneProgressReporter } from 'vscode-languageserver'
import type { DependencyInstallResult, DependencyState, GitDependencySource } from '../dependencies/types'
import { logger as rootLogger } from '../logger'
import type { ApplyEditsResult, ModelEditRequest } from '../model-diff'
import type { LikeC4Services, LikeC4SharedServices } from '../module'
import { InstallDependencies } from '../protocol'

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

/**
 * Reads optional `[params]` of {@link InstallDependencies.command}
 */
function readInstallParams(args: unknown[]): InstallDependencies.Params {
  const [params] = args
  if (params === undefined || params === null) {
    return {}
  }
  if (
    typeof params !== 'object'
    || ('projectId' in params && params.projectId !== undefined && typeof params.projectId !== 'string')
    || ('name' in params && params.name !== undefined && typeof params.name !== 'string')
    || ('update' in params && params.update !== undefined && typeof params.update !== 'boolean')
  ) {
    throw new Error(`Invalid command arguments: ${JSON.stringify(args)}`)
  }
  const projectId = 'projectId' in params && typeof params.projectId === 'string' ? params.projectId : undefined
  const name = 'name' in params && typeof params.name === 'string' ? params.name : undefined
  const update = 'update' in params && params.update === true
  return {
    ...(projectId !== undefined && { projectId: projectId as ProjectId }),
    ...(name !== undefined && { name }),
    ...(update && { update }),
  }
}

/**
 * Key of an install of a git source: installs of the same source are joined
 */
function installKey(source: GitDependencySource, update: boolean): string {
  const repository = parseGitRepositoryUrl(source.git)?.id ?? source.git.trim()
  return JSON.stringify([repository, source.ref, source.path ?? '', update])
}

/**
 * Runs the commands of code actions: removal impact preview, safe delete, apply and discard diff,
 * and the install of git dependencies ({@link InstallDependencies}).
 */
export class LikeC4ExecuteCommandHandler extends AbstractExecuteCommandHandler {
  /**
   * Running installs by source (see {@link installKey}): a repeated call joins them
   */
  #installs = new Map<string, Promise<DependencyInstallResult>>()

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
   * Git and network run outside of the workspace write-lock, the lock is taken only by the sync of external projects.
   * Installs of the same source join a running one, so concurrent calls run the installer once per source.
   * Never throws for failed installs: they are reported to the user and returned in the result.
   */
  async installDependencies(params: InstallDependencies.Params = {}): Promise<InstallDependencies.Res> {
    const update = params.update === true
    const states = this.shared.dependencies.States.all(params.projectId)
      .filter(state => params.name === undefined || state.name === params.name)
    const window = this.window
    if (states.length === 0) {
      logger.debug`no git dependencies to install`
      return { results: [] }
    }
    const installer = this.shared.dependencies.Installer
    if (!installer.supported) {
      window?.showErrorMessage(
        'LikeC4: Remote dependencies are not supported in this environment. Use VS Code desktop or the LikeC4 CLI.',
      )
      return { results: states.map(state => this.toResult(state, { status: 'unsupported' })) }
    }

    const progress = await this.beginProgress(states.length)
    let completed = 0
    const results = await Promise.all(states.map(async state => {
      const result = await this.install(state.source, update)
      completed++
      progress?.report(Math.round(completed / states.length * 100), `${completed}/${states.length}`)
      return this.toResult(state, result)
    }))

    try {
      if (results.some(({ result }) => result.status === 'installed')) {
        progress?.report('Loading dependencies')
        // Registers installed instances and relinks consumers (takes the write-lock itself)
        await this.shared.workspace.WorkspaceManager.syncExternalProjects('reread')
      }
    } finally {
      progress?.done()
    }

    this.reportInstall(results)
    return { results }
  }

  /**
   * Runs the installer for the source, or joins the running install of the same source
   */
  private install(source: GitDependencySource, update: boolean): Promise<DependencyInstallResult> {
    const key = installKey(source, update)
    let running = this.#installs.get(key)
    if (!running) {
      running = this.shared.dependencies.Installer.install(source, { update })
        .catch((error: unknown): DependencyInstallResult => ({
          // The installer never throws by the contract, but be defensive
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        }))
        .finally(() => {
          this.#installs.delete(key)
        })
      this.#installs.set(key, running)
    }
    return running
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

  private reportInstall(results: InstallDependencies.Res['results']) {
    const window = this.window
    let installed = 0
    for (const { projectId, name, result } of results) {
      switch (result.status) {
        case 'failed':
          logger.warn`failed to install dependency ${name} of ${projectId}: ${result.error}`
          window?.showErrorMessage(`LikeC4: Failed to install dependency '${name}': ${result.error}`)
          break
        case 'unsupported':
          window?.showErrorMessage(
            `LikeC4: Dependency '${name}' cannot be installed: remote dependencies are not supported in this environment`,
          )
          break
        case 'installed':
          installed++
          break
      }
    }
    if (installed > 0) {
      window?.showInformationMessage(
        installed === 1 ? `LikeC4: Dependency installed` : `LikeC4: ${installed} dependencies installed`,
      )
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
