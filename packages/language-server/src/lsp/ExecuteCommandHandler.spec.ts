import type { ProjectId } from '@likec4/core/types'
import { describe, it, vi } from 'vitest'
import type { WorkDoneProgressReporter } from 'vscode-languageserver'
import type { DependencyInstallResult } from '../dependencies'
import type { LikeC4SharedServices } from '../module'
import { InstallDependencies } from '../protocol'
import { DependencyDiagnosticCodes } from '../validation/imports'
import { externalProjectId } from '../workspace/ExternalProjects'
import type { NormalizedUri } from '../workspace/ProjectsManager'
import {
  billingSource,
  deferred,
  gitDependencyWorkspace,
  installed,
  installedResult,
  notInstalled,
} from './_git-dependencies-spec'
import { type CommandsWindow, LikeC4ExecuteCommandHandler } from './ExecuteCommandHandler'

/**
 * Fake window of the client: records messages and progress
 */
function fakeWindow() {
  const progress = {
    begin: vi.fn<WorkDoneProgressReporter['begin']>(),
    report: vi.fn<(arg0: number | string, arg1?: string) => void>(),
    done: vi.fn<() => void>(),
  }
  const window = {
    showErrorMessage: vi.fn<(message: string) => void>(),
    showWarningMessage: vi.fn<(message: string) => void>(),
    showInformationMessage: vi.fn<(message: string) => void>(),
    createWorkDoneProgress: vi.fn<() => Promise<WorkDoneProgressReporter>>(() => Promise.resolve(progress)),
  }
  return { window, progress }
}

class TestCommandHandler extends LikeC4ExecuteCommandHandler {
  constructor(shared: LikeC4SharedServices, private testWindow: CommandsWindow) {
    super(shared)
  }
  protected override get window(): CommandsWindow {
    return this.testWindow
  }
}

const diagnosticCodes = (t: { consumer: { diagnostics?: Array<{ code?: unknown }> | undefined } }) =>
  t.consumer.diagnostics?.map(d => d.code)

describe('install dependencies command', () => {
  it('installs, relinks and removes the diagnostic', async ({ expect }) => {
    await using t = await gitDependencyWorkspace()
    t.setState(notInstalled('consumer'), true)
    await t.validateAll()
    expect(diagnosticCodes(t)).toEqual([DependencyDiagnosticCodes.NotInstalled])

    const result = await t.services.shared.lsp.ExecuteCommandHandler.executeCommand(InstallDependencies.command, [
      { projectId: 'consumer', name: 'billing' },
    ])

    expect(result).toEqual({
      results: [{ projectId: 'consumer', name: 'billing', result: installedResult }],
    })
    expect(t.install).toHaveBeenCalledOnce()
    expect(t.install).toHaveBeenCalledWith(billingSource, { update: false })
    // Installed instances are passed to external projects after install
    expect(t.sync).toHaveBeenCalledOnce()
    expect(t.sync).toHaveBeenCalledWith('reread')
    expect(t.install.mock.invocationCallOrder[0]).toBeLessThan(t.sync.mock.invocationCallOrder[0]!)

    await vi.waitFor(() => {
      expect(t.consumer.diagnostics).toEqual([])
    })
  })

  it('runs the installer outside of the workspace write-lock', async ({ expect }) => {
    const lock = deferred<void>()
    await using t = await gitDependencyWorkspace({
      // A write is pending while the installer runs: if the installer held the lock, it would never complete
      install: async () => {
        await lock.promise
        return installedResult
      },
    })
    t.setState(notInstalled('consumer'), true)
    await t.validateAll()
    const command = t.services.shared.lsp.ExecuteCommandHandler.executeCommand(InstallDependencies.command, [])
    await vi.waitFor(() => expect(t.install).toHaveBeenCalledOnce())
    let written = false
    await t.services.shared.workspace.WorkspaceLock.write(() => {
      written = true
    })
    expect(written).toBe(true)
    lock.resolve()
    await expect(command).resolves.toMatchObject({ results: [{ result: { status: 'installed' } }] })
  })

  it('reports progress and the result', async ({ expect }) => {
    await using t = await gitDependencyWorkspace()
    t.setState(notInstalled('consumer'), true)
    const { window, progress } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    await handler.installDependencies({ projectId: 'consumer' as ProjectId })

    expect(progress.begin).toHaveBeenCalledWith('LikeC4: Installing dependency', 0, '0/1')
    expect(progress.done).toHaveBeenCalledOnce()
    expect(window.showInformationMessage).toHaveBeenCalledExactlyOnceWith(`LikeC4: installed 'billing'`)
    expect(window.showErrorMessage).not.toHaveBeenCalled()
  })

  it('shows the error of failed install and keeps the diagnostic', async ({ expect }) => {
    await using t = await gitDependencyWorkspace({
      install: () => Promise.resolve({ status: 'failed', error: 'Repository not found' }),
    })
    t.setState(notInstalled('consumer'), true)
    await t.validateAll()
    const { window, progress } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    const { results } = await handler.installDependencies({})

    expect(results).toEqual([
      { projectId: 'consumer', name: 'billing', result: { status: 'failed', error: 'Repository not found' } },
    ])
    expect(window.showErrorMessage).toHaveBeenCalledWith(
      `LikeC4: Failed to install dependency 'billing': Repository not found`,
    )
    expect(window.showInformationMessage).not.toHaveBeenCalled()
    expect(progress.done).toHaveBeenCalledOnce()
    // Nothing installed: nothing to pass to external projects
    expect(t.sync).not.toHaveBeenCalled()

    await t.validateAll()
    expect(diagnosticCodes(t)).toEqual([DependencyDiagnosticCodes.NotInstalled])
  })

  it('reports an installer that throws as failed', async ({ expect }) => {
    await using t = await gitDependencyWorkspace({
      install: () => Promise.reject(new Error('boom')),
    })
    t.setState(notInstalled('consumer'), true)
    const { window } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    const { results } = await handler.installDependencies()

    expect(results).toMatchObject([{ result: { status: 'failed', error: 'boom' } }])
    expect(window.showErrorMessage).toHaveBeenCalledWith(`LikeC4: Failed to install dependency 'billing': boom`)
  })

  it('reports an installer that throws synchronously as failed', async ({ expect }) => {
    await using t = await gitDependencyWorkspace({
      install: () => {
        throw new Error('sync boom')
      },
    })
    t.setState(notInstalled('consumer'), true)
    const handler = t.services.shared.lsp.ExecuteCommandHandler

    const { results } = await handler.installDependencies()
    expect(results).toMatchObject([{ result: { status: 'failed', error: 'sync boom' } }])
    // The install is settled: a later call runs the installer again
    await handler.installDependencies()
    expect(t.install).toHaveBeenCalledTimes(2)
  })

  it('joins a running install: concurrent calls run the installer once', async ({ expect }) => {
    const result = deferred<DependencyInstallResult>()
    await using t = await gitDependencyWorkspace({
      install: () => result.promise,
    })
    t.setState(notInstalled('consumer'), true)
    const handler = t.services.shared.lsp.ExecuteCommandHandler

    const first = handler.executeCommand(InstallDependencies.command, [{ projectId: 'consumer', name: 'billing' }])
    const second = handler.executeCommand(InstallDependencies.command, [])
    await vi.waitFor(() => expect(t.install).toHaveBeenCalled())
    result.resolve(installedResult)
    const expected = {
      results: [{ projectId: 'consumer', name: 'billing', result: installedResult }],
    }
    await expect(first).resolves.toEqual(expected)
    await expect(second).resolves.toEqual(expected)
    expect(t.install).toHaveBeenCalledOnce()

    // The dependency is installed now: a later call runs the installer again only with update
    await handler.executeCommand(InstallDependencies.command, [])
    expect(t.install).toHaveBeenCalledOnce()
    await handler.executeCommand(InstallDependencies.command, [{ update: true }])
    expect(t.install).toHaveBeenCalledTimes(2)
  })

  it('installs the same source of several consumers once', async ({ expect }) => {
    await using t = await gitDependencyWorkspace()
    t.setState(notInstalled('consumer'), true)
    t.setState(notInstalled('billing', 'payments'), true)

    const { results } = await t.services.shared.lsp.ExecuteCommandHandler.installDependencies()

    expect(results.map(r => [r.projectId, r.name, r.result.status])).toEqual([
      ['consumer', 'billing', 'installed'],
      ['billing', 'payments', 'installed'],
    ])
    expect(t.install).toHaveBeenCalledOnce()
  })

  it('passes update to the installer', async ({ expect }) => {
    await using t = await gitDependencyWorkspace()
    t.setState(installed('consumer'), true)

    await t.services.shared.lsp.ExecuteCommandHandler.executeCommand(InstallDependencies.command, [{ update: true }])

    expect(t.install).toHaveBeenCalledWith(billingSource, { update: true })
  })

  it('returns no results without git dependencies', async ({ expect }) => {
    await using t = await gitDependencyWorkspace()
    const result = await t.services.shared.lsp.ExecuteCommandHandler.executeCommand(InstallDependencies.command, [])
    expect(result).toEqual({ results: [] })
    expect(t.install).not.toHaveBeenCalled()
    expect(t.sync).not.toHaveBeenCalled()
  })

  it('skips installed dependencies without update', async ({ expect }) => {
    await using t = await gitDependencyWorkspace()
    t.setState(installed('consumer'), true)
    t.setState(notInstalled('billing', 'crm'), true)
    const { window } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    const { results } = await handler.installDependencies()

    expect(results).toEqual([
      {
        projectId: 'consumer',
        name: 'billing',
        result: { status: 'installed', instance: expect.anything(), files: 0, cached: true },
      },
      { projectId: 'billing', name: 'crm', result: installedResult },
    ])
    // Installer is called only for the dependency that is not installed
    expect(t.install).toHaveBeenCalledOnce()
    expect(t.sync).toHaveBeenCalledOnce()
    expect(window.showInformationMessage).toHaveBeenCalledExactlyOnceWith(
      `LikeC4: installed 'crm'; already installed 'billing'`,
    )
  })

  it('does not sync when everything is installed already', async ({ expect }) => {
    await using t = await gitDependencyWorkspace()
    t.setState(installed('consumer'), true)
    const { window, progress } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    const { results } = await handler.installDependencies()

    expect(results).toMatchObject([{ result: { status: 'installed', cached: true } }])
    expect(t.install).not.toHaveBeenCalled()
    expect(t.sync).not.toHaveBeenCalled()
    expect(progress.begin).not.toHaveBeenCalled()
    expect(window.showInformationMessage).toHaveBeenCalledExactlyOnceWith(`LikeC4: already installed 'billing'`)
  })

  it('names installed dependencies in the message', async ({ expect }) => {
    await using t = await gitDependencyWorkspace({
      install: () => Promise.resolve(installedResult),
    })
    t.setState(notInstalled('consumer'), true)
    t.setState(
      { ...notInstalled('consumer', 'crm'), source: { git: 'git@github.com:my-org/crm.git', ref: 'main' } },
      true,
    )
    const { window } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    await handler.installDependencies()

    expect(t.install).toHaveBeenCalledTimes(2)
    expect(window.showInformationMessage).toHaveBeenCalledExactlyOnceWith(`LikeC4: installed 'billing', 'crm'`)
  })

  it('shows messages once for joined calls', async ({ expect }) => {
    const result = deferred<DependencyInstallResult>()
    await using t = await gitDependencyWorkspace({ install: () => result.promise })
    t.setState(notInstalled('consumer'), true)
    const { window } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    const first = handler.installDependencies()
    const second = handler.installDependencies()
    await vi.waitFor(() => expect(t.install).toHaveBeenCalled())
    result.resolve(installedResult)
    await Promise.all([first, second])

    expect(t.install).toHaveBeenCalledOnce()
    expect(window.showInformationMessage).toHaveBeenCalledExactlyOnceWith(`LikeC4: installed 'billing'`)
  })

  it('runs update after the running install of the same source', async ({ expect }) => {
    const first = deferred<DependencyInstallResult>()
    const calls = [] as string[]
    await using t = await gitDependencyWorkspace({
      install: async (_source, options) => {
        calls.push(options?.update ? 'update:start' : 'install:start')
        if (!options?.update) {
          await first.promise
        }
        calls.push(options?.update ? 'update:end' : 'install:end')
        return installedResult
      },
    })
    t.setState(notInstalled('consumer'), true)
    const handler = t.services.shared.lsp.ExecuteCommandHandler

    const install = handler.installDependencies()
    await vi.waitFor(() => expect(t.install).toHaveBeenCalledOnce())
    // Same source, path written differently
    t.setState({ ...notInstalled('consumer'), source: { ...billingSource, path: './' } }, true)
    const update = handler.installDependencies({ update: true })
    await new Promise(resolve => setTimeout(resolve, 10))
    // Not started concurrently
    expect(calls).toEqual(['install:start'])
    first.resolve(installedResult)
    await Promise.all([install, update])

    expect(calls).toEqual(['install:start', 'install:end', 'update:start', 'update:end'])
  })

  it('joins an update with a request without update', async ({ expect }) => {
    const result = deferred<DependencyInstallResult>()
    await using t = await gitDependencyWorkspace({ install: () => result.promise })
    t.setState(notInstalled('consumer'), true)
    const handler = t.services.shared.lsp.ExecuteCommandHandler

    const update = handler.installDependencies({ update: true })
    const install = handler.installDependencies()
    await vi.waitFor(() => expect(t.install).toHaveBeenCalled())
    result.resolve(installedResult)
    await Promise.all([update, install])

    expect(t.install).toHaveBeenCalledExactlyOnceWith(billingSource, { update: true })
  })

  it('reports cached files as the loaded documents of the registered instance', async ({ expect }) => {
    await using t = await gitDependencyWorkspace()
    const billing = t.services.shared.workspace.ProjectsManager.getProject('billing' as ProjectId)
    t.services.shared.workspace.ExternalProjects.register({
      ...billing,
      id: externalProjectId('billing'),
      files: new Map([
        ['file:///deps/billing/a.c4' as NormalizedUri, 'model {}'],
        ['file:///deps/billing/b.c4' as NormalizedUri, 'model {}'],
      ]),
    })
    t.setState(installed('consumer'), true)

    const { results } = await t.services.shared.lsp.ExecuteCommandHandler.installDependencies()

    expect(results).toMatchObject([{ result: { status: 'installed', files: 2, cached: true } }])
    expect(t.install).not.toHaveBeenCalled()
  })

  it('reports names of a joined call that differ from the names of the owner', async ({ expect }) => {
    const result = deferred<DependencyInstallResult>()
    await using t = await gitDependencyWorkspace({ install: () => result.promise })
    t.setState(notInstalled('consumer'), true)
    // Same source under another name in another consumer
    t.setState(notInstalled('billing', 'payments'), true)
    const { window } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    const owner = handler.installDependencies({ projectId: 'consumer' as ProjectId })
    const joined = handler.installDependencies({ projectId: 'billing' as ProjectId })
    await vi.waitFor(() => expect(t.install).toHaveBeenCalled())
    result.resolve(installedResult)
    await Promise.all([owner, joined])

    expect(t.install).toHaveBeenCalledOnce()
    expect(window.showInformationMessage.mock.calls.map(([message]) => message).sort()).toEqual([
      `LikeC4: installed 'billing'`,
      `LikeC4: installed 'payments'`,
    ])
  })

  it('a call that only joined does not show progress and does not sync, but waits for the sync', async ({ expect }) => {
    const result = deferred<DependencyInstallResult>()
    const sync = deferred<void>()
    await using t = await gitDependencyWorkspace({ install: () => result.promise })
    t.sync.mockImplementation(() => sync.promise)
    t.setState(notInstalled('consumer'), true)
    const { window, progress } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    const owner = handler.installDependencies()
    const joined = handler.installDependencies()
    let joinedDone = false
    void joined.then(() => {
      joinedDone = true
    })
    await vi.waitFor(() => expect(t.install).toHaveBeenCalled())
    result.resolve(installedResult)
    await vi.waitFor(() => expect(t.sync).toHaveBeenCalledOnce())
    await new Promise(resolve => setTimeout(resolve, 10))
    // The owner has not synced yet
    expect(joinedDone).toBe(false)
    sync.resolve()
    await Promise.all([owner, joined])

    expect(t.sync).toHaveBeenCalledOnce()
    expect(window.createWorkDoneProgress).toHaveBeenCalledOnce()
    expect(progress.begin).toHaveBeenCalledOnce()
    expect(window.showInformationMessage).toHaveBeenCalledExactlyOnceWith(`LikeC4: installed 'billing'`)
  })

  it('does not install on hosts without installer', async ({ expect }) => {
    await using t = await gitDependencyWorkspace({ supported: false })
    t.setState(notInstalled('consumer'), true)
    const { window } = fakeWindow()
    const handler = new TestCommandHandler(t.services.shared, window)

    const { results } = await handler.installDependencies()

    expect(results).toEqual([{ projectId: 'consumer', name: 'billing', result: { status: 'unsupported' } }])
    expect(t.install).not.toHaveBeenCalled()
    expect(window.showErrorMessage).toHaveBeenCalledWith(
      'LikeC4: Remote dependencies are not supported in this environment. Use VS Code desktop or the LikeC4 CLI.',
    )
  })

  it.for(
    [
      ['a field of wrong type', { name: 1 }],
      ['an array', ['consumer']],
      ['a string', 'consumer'],
      ['a class instance', new Date()],
    ] as const,
  )('rejects %s as arguments', async ([_, params], { expect }) => {
    await using t = await gitDependencyWorkspace()
    await expect(
      t.services.shared.lsp.ExecuteCommandHandler.executeCommand(InstallDependencies.command, [params]),
    ).rejects.toThrow('Invalid command arguments')
    expect(t.install).not.toHaveBeenCalled()
  })
})
