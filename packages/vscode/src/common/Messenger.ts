import vscode from 'vscode'

import { type DiagramView } from '@likec4/core'
import { ExtensionToPanel, WebviewToExtension } from '@likec4/vscode-preview/protocol'
import { Messenger as VsCodeMessenger } from 'vscode-messenger'
import { type WebviewTypeMessageParticipant } from 'vscode-messenger-common'
import { Logger } from '../logger'
import { AbstractDisposable } from '../util'
import { PreviewPanel } from './panel/PreviewPanel'
import { cmdLocate } from '../const'

const toPreviewPanel = {
  type: 'webview',
  webviewType: PreviewPanel.ViewType
} satisfies WebviewTypeMessageParticipant

export default class Messenger extends AbstractDisposable {
  private messenger = new VsCodeMessenger({
    debugLog: true
  })

  constructor() {
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
