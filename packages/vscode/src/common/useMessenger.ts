import { loggable } from '@likec4/log'
import {
  BroadcastModelUpdate,
  FetchComputedModel,
  FetchDiagramView,
  WebviewMsgs,
} from '@likec4/vscode-preview/protocol'
import { executeCommand, useActiveTextEditor, useDisposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { Messenger } from 'vscode-messenger'
import { BROADCAST } from 'vscode-messenger-common'
import { logger as rootLogger } from '../logger'
import { commands } from '../meta'
import { type Rpc } from '../Rpc'
import { useDiagramPreview } from './useDiagramPreview'

const logger = rootLogger.getChild('Messenger')

let instance: Messenger | null = null

export const useMessenger = () => {
  return instance ??= new Messenger()
}

export function activateMessenger(rpc: Rpc) {
  const preview = useDiagramPreview()
  const messenger = useMessenger()
  const activeTextEditor = useActiveTextEditor()

  rpc.onDidChangeModel(() => {
    logger.debug`broadcast ${'onDidChangeModel'}`
    messenger.sendNotification(BroadcastModelUpdate, BROADCAST)
  })

  useDisposable(messenger.onRequest(FetchComputedModel, async () => {
    logger.debug`onRequest ${'FetchComputedModel'}`
    return await rpc.fetchComputedModel()
  }))

  useDisposable(messenger.onRequest(FetchDiagramView, async (viewId) => {
    logger.debug`onRequest ${'FetchDiagramView'} of ${viewId}`
    try {
      const result = await rpc.layoutView(viewId)
      return result
        ? {
          view: result.diagram,
          error: null,
        }
        : {
          view: null,
          error: `View "${viewId}" not found`,
        }
    } catch (e) {
      const error = loggable(e)
      logger.error(error)
      return {
        view: null,
        error,
      }
    }
  }))

  useDisposable(messenger.onNotification(WebviewMsgs.CloseMe, () => {
    preview.close()
  }))

  useDisposable(messenger.onNotification(WebviewMsgs.Locate, async (params) => {
    await executeCommand(commands.locate, params)
  }))

  useDisposable(messenger.onNotification(WebviewMsgs.NavigateTo, ({ viewId }) => {
    preview.open(viewId)
  }))

  useDisposable(messenger.onNotification(WebviewMsgs.OnChange, async ({ viewId, change }) => {
    try {
      let loc = await rpc.changeView({ viewId, change })
      if (!loc) {
        logger.warn(`rpc.changeView returned null`)
        return
      }
      const location = rpc.client.protocol2CodeConverter.asLocation(loc)
      let viewColumn = activeTextEditor.value?.viewColumn ?? vscode.ViewColumn.One
      // if (PreviewPanel.current?.panel.viewColumn === viewColumn) {
      //   viewColumn = vscode.ViewColumn.Beside
      // }
      const selection = location.range
      const preserveFocus = viewColumn === vscode.ViewColumn.Beside
      const editor = await vscode.window.showTextDocument(location.uri, {
        viewColumn,
        selection,
        preserveFocus,
      })
      editor.revealRange(selection)

      await vscode.workspace.save(location.uri)
    } catch (e) {
      logger.error(`[Messenger] onChange error: ${e}`)
    }
  }))

  return messenger
}
