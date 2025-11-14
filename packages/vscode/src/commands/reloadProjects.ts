import { useCommand } from 'reactive-vscode'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { commands } from '../meta'
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
