import { useCommand } from 'reactive-vscode'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import type { RpcClient } from './types'

export interface ReloadProjectsCommandDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
}

export function registerReloadProjectsCommand({ sendTelemetry, rpc }: ReloadProjectsCommandDeps) {
  const { logWarn } = useExtensionLogger()
  useCommand(commands.reloadProjects, async () => {
    sendTelemetry(commands.reloadProjects)
    try {
      await rpc.reloadProjects()
    } catch (e) {
      logWarn(e)
    }
  })
}
