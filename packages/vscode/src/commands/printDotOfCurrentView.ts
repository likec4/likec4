import { toValue, useCommand } from 'reactive-vscode'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { commands } from '../meta'
import type { PreviewPanel, RpcClient } from './types'

export interface PrintDotOfCurrentViewDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
  preview: PreviewPanel
}

export function registerPrintDotOfCurrentViewCommand({ sendTelemetry, rpc, preview }: PrintDotOfCurrentViewDeps) {
  const { loggerOutput, logger } = useExtensionLogger()
  useCommand(commands.printDotOfCurrentview, async () => {
    sendTelemetry(commands.printDotOfCurrentview)
    const viewId = toValue(preview.viewId)
    const projectId = toValue(preview.projectId)
    if (!viewId || !projectId) {
      logger.warn('No preview panel found')
      return
    }
    const result = await rpc.layoutView({ viewId, projectId })
    if (!result) {
      logger.warn(`Failed to layout view ${viewId}`)
      return
    }
    loggerOutput.info(`DOT of view "${viewId}"`)
    loggerOutput.info('\n' + result.dot)
    loggerOutput.show(false)
  })
}
