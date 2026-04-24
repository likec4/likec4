import type { Locate } from '@likec4/language-server/protocol'
import { toValue, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { commands } from '../meta'
import { useDiagramPanel } from '../panel/useDiagramPanel'
import { useExtensionLogger } from '../useExtensionLogger'
import { showEditorNextToPreview } from '../utils'
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
    const location = await rpc.locate(params)
    if (!location) {
      logger.debug(`rpc.locate returned null`)
      return
    }
    const preview = useDiagramPanel()
    await showEditorNextToPreview({
      previewColumn: toValue(preview.panelViewColumn),
      location,
      preserveFocus: false,
      reveal: vscode.TextEditorRevealType.InCenterIfOutsideViewport,
    })
  })
}
