import type { ProjectId } from '@likec4/core/types'
import { loggable } from '@likec4/log'
import {
  BroadcastModelUpdate,
  FetchComputedModel,
  FetchDiagramView,
  WebviewMsgs,
} from '@likec4/vscode-preview/protocol'
import {
  createSingletonComposable,
  executeCommand,
  toValue,
  useActiveTextEditor,
  useDisposable,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import { Messenger } from 'vscode-messenger'
import { BROADCAST } from 'vscode-messenger-common'
import { logger as rootLogger } from '../logger'
import { commands } from '../meta'
import type { Rpc } from '../Rpc'
import { performanceMark } from '../utils'
import type { DiagramPanel } from './useDiagramPanel'

const logger = rootLogger.getChild('messenger')

export const useMessenger = createSingletonComposable(() => {
  const messenger = new Messenger()
  return messenger
})
export function activateMessenger(
  { rpc, preview, messenger }: { rpc: Rpc; preview: DiagramPanel; messenger: Messenger },
) {
  logger.debug('useMessenger activation')
  rpc.onDidChangeModel(() => {
    logger.debug`broadcast ${'onDidChangeModel'}`
    messenger.sendNotification(BroadcastModelUpdate, BROADCAST)
  })

  rpc.onRequestOpenView((params) => {
    logger.debug`request open view ${params.viewId} of project ${params.projectId}`
    preview.open(params.viewId, params.projectId)
  })

  const activeTextEditor = useActiveTextEditor()

  useDisposable(messenger.onRequest(FetchComputedModel, async () => {
    const t0 = performanceMark()
    try {
      const projectId = toValue(preview.projectId) ?? 'default'
      const result = await rpc.fetchComputedModel(projectId)
      logger.debug(`request {req} in ${t0.pretty}`, { req: 'fetchComputedModel' })
      return result
    } catch (err) {
      logger.warn(`request {req} failed after ${t0.pretty}`, { req: 'fetchComputedModel', err })
      throw err // propagate to client
    }
  }))

  useDisposable(messenger.onRequest(FetchDiagramView, async (viewId) => {
    const t0 = performanceMark()
    try {
      const projectId = toValue(preview.projectId) ?? 'default'
      const result = await rpc.layoutView({ viewId, projectId })
      logger.debug(`request {req} of {viewId} in ${t0.pretty}`, { req: 'layoutView', viewId })
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
      logger.warn(`request {req} of {viewId} failed after ${t0.pretty}`, { req: 'layoutView', err, viewId })
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
    const projectId = toValue(preview.projectId) ?? 'default' as ProjectId
    await executeCommand(commands.locate, { ...params, projectId })
  }))

  useDisposable(messenger.onNotification(WebviewMsgs.NavigateTo, ({ viewId }) => {
    const projectId = toValue(preview.projectId) ?? 'default' as ProjectId
    preview.open(viewId, projectId)
  }))

  useDisposable(messenger.onNotification(WebviewMsgs.OnChange, async ({ viewId, change }) => {
    try {
      const projectId = toValue(preview.projectId) ?? 'default' as ProjectId
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
    } catch (error) {
      logger.error(`[Messenger] onChange error`, { error })
      throw error // propagate to client
    }
  }))
}
