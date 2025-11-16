import { toValue, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import type { PreviewPanel, RpcClient } from './types'

export interface PrintDotOfCurrentViewDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
  preview: PreviewPanel
}

export function registerPrintDotOfCurrentViewCommand({ sendTelemetry, rpc, preview }: PrintDotOfCurrentViewDeps) {
  const { output, logger } = useExtensionLogger()
  useCommand(commands.printDotOfCurrentview, async () => {
    sendTelemetry(commands.printDotOfCurrentview)
    const viewId = toValue(preview.viewId)
    const projectId = toValue(preview.projectId)
    if (!viewId || !projectId) {
      logger.warn('No preview panel found')
      await vscode.window.showInformationMessage('Open a preview to print its DOT representation.')
      return
    }
    const result = await rpc.layoutView({ viewId, projectId })
    if (!result) {
      output.error(`Failed to layout view ${viewId}`)
      return
    }
    output.info(`DOT of view "${viewId}"`)
    output.appendLine('\n' + result.dot)
    output.show(false)
  })
}
