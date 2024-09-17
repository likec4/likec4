import vscode from 'vscode'

import type { ViewID } from '@likec4/core'
import {
  BroadcastModelUpdate,
  FetchComputedModel,
  FetchDiagramView,
  GetLastClickedNode,
  OnOpenView,
  WebviewMsgs
} from '@likec4/vscode-preview/protocol'
import { Messenger as VsCodeMessenger } from 'vscode-messenger'
import { BROADCAST } from 'vscode-messenger-common'
import { cmdLocate } from './const'
import type { ExtensionController } from './ExtensionController'
import { logger } from './logger'
import { AbstractDisposable } from './util'
import { PreviewPanel } from './webview/PreviewPanel'

export type DirectToWebviewProtocol = ReturnType<Messenger['registerWebViewPanel']>

export class Messenger extends AbstractDisposable {
  private messenger = new VsCodeMessenger()

  constructor(
    ctrl: ExtensionController
  ) {
    super()

    this.onDispose(
      this.messenger.onNotification(WebviewMsgs.CloseMe, () => {
        PreviewPanel.current?.dispose()
      })
    )
    this.onDispose(
      this.messenger.onNotification(WebviewMsgs.NavigateTo, ({ viewId }) => {
        PreviewPanel.createOrReveal({
          viewId: viewId ?? ('index' as ViewID),
          ctrl
        })
      })
    )
    this.onDispose(
      this.messenger.onNotification(WebviewMsgs.Locate, async params => {
        await vscode.commands.executeCommand(cmdLocate, params)
      })
    )
    this.onDispose(
      this.messenger.onNotification(WebviewMsgs.OnChange, async ({ viewId, change }) => {
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

    // this.onDispose(
    //   this.messenger.onNotification(WebviewToExtension.onWebviewStateChange, (changeReq) => {
    //     try {
    //       ctrl.setPreviewPanelState(changeReq)
    //     } catch (e) {
    //       logger.error(`[Messenger] onWebviewStateChange error: ${e}`)
    //     }
    //   })
    // )

    // this.onDispose(
    //   ctrl.rpc.onDidChangeModel(() => {
    //     this.messenger.sendNotification(OnModelUpdate, BROADCAST)
    //   })
    // )

    this.onDispose(
      this.messenger.onRequest(FetchComputedModel, async () => {
        try {
          return await ctrl.likec4model.fetchComputedModel()
        } catch (e) {
          logger.error(e)
          return {
            model: null
          }
        }
      })
    )

    this.onDispose(
      this.messenger.onRequest(FetchDiagramView, async (viewId) => {
        try {
          const result = await ctrl.likec4model.layoutView(viewId)
          if (!result) {
            return { view: null, error: 'View not found' }
          }
          return {
            view: result.diagram,
            error: null
          }
        } catch (e) {
          logger.error(e)
          return {
            view: null,
            error: e instanceof Error ? (e.stack ?? e.message) : '' + e
          }
        }
      })
    )
  }

  notifyModelUpdate() {
    this.messenger.sendNotification(BroadcastModelUpdate, BROADCAST)
  }

  registerWebViewPanel(panel: vscode.WebviewPanel) {
    const participantId = this.messenger.registerWebviewPanel(panel, {
      broadcastMethods: [BroadcastModelUpdate.method]
    })
    return {
      notifyToChangeView: (viewId: ViewID) => {
        this.messenger.sendNotification(OnOpenView, participantId, { viewId })
      },

      getLastClickedNode: async () => {
        return await this.messenger.sendRequest(GetLastClickedNode, participantId)
      }
    }
  }
  //   logger.info(`[Messenger] diagramUpdate`)
  //   this.messenger.sendNotification(ExtensionToPanel.diagramUpdate, AddressBook.PreviewPanel, { view })
  // }

  // diagramUpdate(view: DiagramView) {
  //   logger.info(`[Messenger] diagramUpdate`)
  //   this.messenger.sendNotification(ExtensionToPanel.diagramUpdate, AddressBook.PreviewPanel, { view })
  // }

  // sendError(error: string) {
  //   this.messenger.sendNotification(ExtensionToPanel.error, { type: 'broadcast' }, { error })
  // }

  public override dispose() {
    super.dispose()
    logger.debug(`[Messenger] disposed`)
  }

  get diagnostics() {
    return this.messenger.diagnosticApi({
      withParameterData: true
    })
  }
}
