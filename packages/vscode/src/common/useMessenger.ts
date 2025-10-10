import type { ProjectId } from '@likec4/core/types'
import { loggable } from '@likec4/log'
import {
  BroadcastModelUpdate,
  FetchComputedModel,
  FetchDiagramView,
  ReadLocalIcon,
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
      // Do not open snapshot file (it is too big)
      if (change.op === 'save-view-snapshot') {
        logger.debug(`View snapshot ${viewId} saved to ${loc.uri}`)
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

  // useDisposable(messenger.onNotification(WebviewMsgs.SaveLayout, async ({ view }) => {
  //   const projectId = toValue(preview.projectId) ?? 'default' as ProjectId
  //   await rpc.saveManualLayout({ view, projectId })
  // }))

  useDisposable(messenger.onRequest(ReadLocalIcon, async (uri) => {
    const t0 = performanceMark()
    try {
      // Convert file:// URI to vscode.Uri
      const fileUri = vscode.Uri.parse(uri)

      // Read the file using VSCode filesystem API
      const fileData = await vscode.workspace.fs.readFile(fileUri)

      // Convert to base64
      const base64data = Buffer.from(fileData).toString('base64')

      // Determine MIME type based on file extension
      const ext = fileUri.path.toLowerCase().split('.').pop()
      let mimeType = 'image/png' // default
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg'
          break
        case 'png':
          mimeType = 'image/png'
          break
        case 'gif':
          mimeType = 'image/gif'
          break
        case 'svg':
          mimeType = 'image/svg+xml'
          break
        case 'webp':
          mimeType = 'image/webp'
          break
      }

      const dataUri = `data:${mimeType};base64,${base64data}`

      logger.debug(`request {req} for {uri} in ${t0.pretty}`, { req: 'readLocalIcon', uri })
      return { base64data: dataUri }
    } catch (err) {
      logger.warn(`request {req} for {uri} failed after ${t0.pretty}`, { req: 'readLocalIcon', uri, err })
      // Return null for any errors (file not found, permission denied, etc.)
      return { base64data: null }
    }
  }))
}
