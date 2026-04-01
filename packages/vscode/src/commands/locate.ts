import type { Locate } from '@likec4/language-server/protocol'
import { toValue, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { commands } from '../meta'
import { useDiagramPanel } from '../panel/useDiagramPanel'
import { useExtensionLogger } from '../useExtensionLogger'
import { findSourceViewColumn } from '../utils'
import type { RpcClient } from './types'

export interface LocateCommandDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
}

export function registerLocateCommand({ sendTelemetry, rpc }: LocateCommandDeps) {
  const logger = useExtensionLogger().logger
  useCommand(commands.locate, async (params: Locate.Params) => {
    logger.debug(`command {command} with params: {params}`, { command: commands.locate, params })
    sendTelemetry(commands.locate)
    const loc = await rpc.locate(params)
    if (!loc) {
      logger.debug(`rpc.locate returned null`)
      return
    }
    const location = rpc.client.protocol2CodeConverter.asLocation(loc)
    const preview = useDiagramPanel()
    const viewColumn = findSourceViewColumn(toValue(preview.panelViewColumn))
    const editor = await vscode.window.showTextDocument(location.uri, {
      viewColumn,
      selection: location.range,
      preserveFocus: true,
    })
    editor.revealRange(location.range)
  })
}
