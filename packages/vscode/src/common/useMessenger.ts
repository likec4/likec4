import { nonNullable } from '@likec4/core'
import { loggable } from '@likec4/log'
import {
  BroadcastModelUpdate,
  FetchComputedModel,
  FetchDiagramView,
  WebviewMsgs,
} from '@likec4/vscode-preview/protocol'
import prettyMs from 'pretty-ms'
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
    const t0 = performance.now()
    try {
      const projectId = preview.projectId()
      const result = await rpc.fetchComputedModel(projectId ?? 'default')
      const t1 = performance.now()
      logger.debug(`request {req} in ${prettyMs(t1 - t0)}`, { req: 'fetchComputedModel' })
      return result
    } catch (err) {
      const t1 = performance.now()
      logger.warn(`request {req} failed after ${prettyMs(t1 - t0)}`, { req: 'fetchComputedModel', err })
      return { model: null }
    }
  }))

  useDisposable(messenger.onRequest(FetchDiagramView, async (viewId) => {
    const t0 = performance.now()
    try {
      const projectId = preview.projectId()
      const result = await rpc.layoutView({ viewId, projectId })
      const t1 = performance.now()
      logger.debug(`request {req} of {viewId} in ${prettyMs(t1 - t0)}`, { req: 'layoutView', viewId })
      return result
        ? {
          view: result.diagram,
          error: null,
        }
        : {
          view: null,
          error: `View "${viewId}" not found`,
        }
    } catch (err) {
      const t1 = performance.now()
      logger.warn(`request {req} of {viewId} failed after ${prettyMs(t1 - t0)}`, { req: 'layoutView', err, viewId })
      const error = loggable(err)
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
    const projectId = preview.projectId()
    await executeCommand(commands.locate, { ...params, projectId })
  }))

  useDisposable(messenger.onNotification(WebviewMsgs.NavigateTo, ({ viewId }) => {
    const projectId = nonNullable(preview.projectId(), 'PreviewPanel is missing projectId')
    preview.open(viewId, projectId)
  }))

  useDisposable(messenger.onNotification(WebviewMsgs.OnChange, async ({ viewId, change }) => {
    try {
      const projectId = preview.projectId()
      let loc = await rpc.changeView({ viewId, projectId, change })
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
