import vscode from 'vscode'

import { type DiagramView } from '@likec4/core'
import { ExtensionToPanel, WebviewToExtension } from '@likec4/vscode-preview/protocol'
import { Messenger as VsCodeMessenger } from 'vscode-messenger'
import { type WebviewTypeMessageParticipant } from 'vscode-messenger-common'
import { cmdLocate } from '../const'
import { Logger } from '../logger'
import { AbstractDisposable } from '../util'
import { PreviewPanel } from './panel/PreviewPanel'
import type { Rpc } from './Rpc'

const toPreviewPanel = {
  type: 'webview',
  webviewType: PreviewPanel.ViewType
} satisfies WebviewTypeMessageParticipant

export default class Messenger extends AbstractDisposable {
  private messenger = new VsCodeMessenger({
    debugLog: true
  })

  constructor(
    private rpc: Rpc
  ) {
    super()
    this.onDispose(
      this.messenger.onNotification(WebviewToExtension.imReady, () => {
        PreviewPanel.current?.open()
      })
    )
    this.onDispose(
      this.messenger.onNotification(WebviewToExtension.closeMe, () => {
        PreviewPanel.current?.dispose()
      })
    )
    this.onDispose(
      this.messenger.onNotification(WebviewToExtension.openView, ({ viewId }) => {
        PreviewPanel.current?.open(viewId)
      })
    )
    this.onDispose(
      this.messenger.onNotification(WebviewToExtension.locate, async params => {
        await vscode.commands.executeCommand(cmdLocate, params)
      })
    )
    this.onDispose(
      this.messenger.onNotification(WebviewToExtension.onChange, async params => {
        Logger.debug(`[Messenger] onChange: ${JSON.stringify(params.change, null, 4)}`)
        const loc = await this.rpc.changeView(params.change)
        if (loc) {
          const location = this.rpc.client.protocol2CodeConverter.asLocation(loc)
          const editor = await vscode.window.showTextDocument(location.uri, {
            viewColumn: vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One,
            selection: location.range
          })
          editor.revealRange(location.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
        }
      })
    )
  }

  registerWebViewPanel(panel: vscode.WebviewPanel) {
    this.messenger.registerWebviewPanel(panel, {
      broadcastMethods: [ExtensionToPanel.error.method]
    })
  }

  diagramUpdate(view: DiagramView) {
    Logger.info(`[Extension.Messenger] diagramUpdate`)
    this.messenger.sendNotification(ExtensionToPanel.diagramUpdate, toPreviewPanel, { view })
  }

  sendError(error: string) {
    this.messenger.sendNotification(ExtensionToPanel.error, { type: 'broadcast' }, { error })
  }

  async getHoveredElement() {
    return await this.messenger.sendRequest(ExtensionToPanel.getHoveredElement, toPreviewPanel)
  }

  public override dispose() {
    super.dispose()
    Logger.debug(`[Extension.Messenger] disposed`)
  }
}
