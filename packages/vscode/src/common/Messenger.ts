import vscode from 'vscode'

import { type DiagramView } from '@likec4/core'
import { ExtensionToPanel, WebviewToExtension } from '@likec4/vscode-preview/protocol'
import { Messenger as VsCodeMessenger } from 'vscode-messenger'
import { type WebviewTypeMessageParticipant } from 'vscode-messenger-common'
import { cmdLocate } from '../const'
import { logger } from '../logger'
import { AbstractDisposable } from '../util'
import type { ExtensionController } from './ExtensionController'
import { PreviewPanel } from './panel/PreviewPanel'

const toPreviewPanel = {
  type: 'webview',
  webviewType: PreviewPanel.ViewType
} satisfies WebviewTypeMessageParticipant

export default class Messenger extends AbstractDisposable {
  private messenger = new VsCodeMessenger({
    debugLog: true
  })

  constructor(
    ctrl: ExtensionController
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
      this.messenger.onNotification(WebviewToExtension.onChange, async ({ viewId, change }) => {
        try {
          let loc = await ctrl.rpc.changeView({ viewId, change })
          if (!loc) {
            logger.warn(`rpc.changeView returned null`)
            return
          }
          const location = ctrl.rpc.client.protocol2CodeConverter.asLocation(loc)
          let viewColumn = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One
          if (PreviewPanel.current?.panel.viewColumn === viewColumn) {
            viewColumn = vscode.ViewColumn.Beside
          }
          const selection = location.range
          const preserveFocus = viewColumn === vscode.ViewColumn.Beside
          const editor = await vscode.window.showTextDocument(location.uri, {
            viewColumn,
            selection,
            preserveFocus
          })
          editor.revealRange(selection)

          await vscode.workspace.save(location.uri)
        } catch (e) {
          logger.error(`[Messenger] onChange error: ${e}`)
        }
      })
    )

    this.onDispose(
      this.messenger.onNotification(WebviewToExtension.onWebviewStateChange, (changeReq) => {
        try {
          ctrl.setPreviewPanelState(changeReq)
        } catch (e) {
          logger.error(`[Messenger] onWebviewStateChange error: ${e}`)
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
    logger.info(`[Messenger] diagramUpdate`)
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
    logger.debug(`[Messenger] disposed`)
  }
}
