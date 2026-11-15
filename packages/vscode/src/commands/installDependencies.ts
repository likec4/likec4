import { InstallDependencies } from '@likec4/language-server/protocol'
import { useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { ExecuteCommandRequest } from 'vscode-languageclient'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import { summarizeInstallResults } from './installDependenciesSummary'
import type { RpcClient } from './types'

export interface InstallDependenciesCommandDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
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
          const result: InstallDependencies.Res | null | undefined = await rpc.client.sendRequest(
            ExecuteCommandRequest.type,
            {
              command: InstallDependencies.command,
              arguments: [params],
            },
          )
          return result
        },
      )
      const { level, message } = summarizeInstallResults(res, update)
      switch (level) {
        case 'error':
          logger.error(message)
          void vscode.window.showErrorMessage(message)
          break
        case 'warning':
          logger.warn(message)
          void vscode.window.showWarningMessage(message)
          break
        case 'info':
          void vscode.window.showInformationMessage(message)
          break
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
