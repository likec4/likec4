import { InstallDependencies } from '@likec4/language-server/protocol'
import { useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { ExecuteCommandRequest } from 'vscode-languageclient'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import type { RpcClient } from './types'

export interface InstallDependenciesCommandDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
}

/**
 * Summary of the results of the server command, shown to the user
 */
export function summarizeInstallResults(
  res: InstallDependencies.Res | null | undefined,
  update: boolean,
): { level: 'info' | 'warning'; message: string } {
  const results = res?.results ?? []
  if (results.length === 0) {
    return { level: 'info', message: 'LikeC4: no git dependencies found' }
  }
  const failed = results.flatMap(({ projectId, name, result }) =>
    result.status === 'failed' ? [`${projectId}/${name}: ${result.error}`] : []
  )
  const unsupported = results.filter(({ result }) => result.status === 'unsupported').length
  const installed = results.length - failed.length - unsupported
  const verb = update ? 'updated' : 'installed'
  switch (true) {
    case failed.length > 0:
      return {
        level: 'warning',
        message: `LikeC4: ${installed} of ${results.length} git dependencies ${verb}, failed: ${failed.join('; ')}`,
      }
    case unsupported > 0:
      return {
        level: 'warning',
        message: `LikeC4: git dependencies are not supported in this environment (${unsupported} skipped)`,
      }
    default:
      return { level: 'info', message: `LikeC4: ${installed} git dependencies ${verb}` }
  }
}

/**
 * Commands of the palette that install (or update) all git dependencies of all projects:
 * they call the server command `likec4.lsp.install-dependencies` (git runs in the language server process).
 */
export function registerInstallDependenciesCommands({ sendTelemetry, rpc }: InstallDependenciesCommandDeps) {
  const { logger, output } = useExtensionLogger()

  async function run(commandId: string, update: boolean) {
    sendTelemetry(commandId)
    const params: InstallDependencies.Params = update ? { update } : {}
    try {
      const res = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: update ? 'LikeC4: updating git dependencies' : 'LikeC4: installing git dependencies',
        },
        async () => {
          const result: InstallDependencies.Res | null = await rpc.client.sendRequest(ExecuteCommandRequest.type, {
            command: InstallDependencies.command,
            arguments: [params],
          })
          return result
        },
      )
      const { level, message } = summarizeInstallResults(res, update)
      if (level === 'warning') {
        logger.warn(message)
        void vscode.window.showWarningMessage(message)
      } else {
        void vscode.window.showInformationMessage(message)
      }
    } catch (error) {
      logger.error('Failed to install git dependencies', { error })
      output.show(true)
      void vscode.window.showErrorMessage('LikeC4: failed to install git dependencies, see the output for details')
    }
  }

  useCommand(commands.installDependencies, () => run(commands.installDependencies, false))
  useCommand(commands.updateDependencies, () => run(commands.updateDependencies, true))
}
