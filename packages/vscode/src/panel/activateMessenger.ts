import { loggable, wrapError } from '@likec4/log'
import {
  executeCommand,
  toValue,
  useActiveTextEditor,
} from 'reactive-vscode'
import vscode from 'vscode'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import { useMessenger } from '../useMessenger'
import { useRpc } from '../useRpc'
import { performanceMark } from '../utils'
import { useDiagramPanel } from './useDiagramPanel'

export function activateMessenger() {
  const rpc = useRpc()
  const messenger = useMessenger()
  const preview = useDiagramPanel()

  const { logger, output } = useExtensionLogger('messenger')

  logger.debug('activating messenger <-> preview panel')

  messenger.handleFetchComputedModel(async ({ projectId }) => {
    const t0 = performanceMark()
    try {
      const { model } = await rpc.fetchComputedModel(projectId)
      if (model) {
        logger.debug(`request {req} of {projectId} in ${t0.pretty}`, { req: 'fetchComputedModel', projectId })
      } else {
        logger.warn(`No data returned in request {req} for {projectId} in ${t0.pretty}`, {
          req: 'fetchComputedModel',
          projectId,
        })
      }
      return {
        model,
        error: null,
      }
    } catch (err) {
      logger.warn(`request {req} of {projectId} failed after ${t0.pretty}`, {
        req: 'fetchComputedModel',
        projectId,
        err,
      })
      const error = loggable(err)
      output.show()
      return {
        model: null,
        error,
      }
    }
  })

  messenger.handleFetchLayoutedView(async (params) => {
    const t0 = performanceMark()
    const { viewId, layoutType = 'manual' } = params
    try {
      const projectId = params.projectId ?? toValue(preview.projectId) ?? 'default'
      const result = await rpc.layoutView({ viewId, projectId, layoutType })
      if (!result) {
        logger.warn(
          `No view {viewId} can be found or layouted in {projectId} ${t0.pretty}`,
          { viewId, projectId },
        )
        return {
          view: null,
          error: `View "${viewId}" not found`,
        }
      }
      let view = result.diagram
      logger.debug(
        `{req} of {viewId} in {projectId} (requested: {layoutType}, actual: {viewlayout}) in ${t0.pretty}`,
        { req: 'layoutView', viewId, projectId, layoutType, viewlayout: view._layout },
      )

      return {
        view,
        error: null,
      }
    } catch (err) {
      logger.warn(`request {req} of {viewId} failed after ${t0.pretty}`, { req: 'layoutView', err, viewId })
      const error = loggable(err)
      output.show()
      return {
        view: null,
        error,
      }
    }
  })

  messenger.handleFetchProjectsOverview(async () => {
    const t0 = performanceMark()
    try {
      const result = await rpc.fetchProjectsOverview()
      logger.debug(`request {req} in ${t0.pretty}`, { req: 'fetchProjectsOverview' })
      return result
    } catch (err) {
      logger.warn(`request {req} failed after ${t0.pretty}`, { req: 'fetchProjectsOverview', err })
      throw err // propagate to client
    }
  })

  messenger.onWebviewLocate(async (params) => {
    await executeCommand(commands.locate, params)
  })

  // Moved to useDiagramPanel
  // messenger.onWebviewNavigateTo(({ viewId }) => {
  //   const projectId = toValue(preview.projectId) ?? 'default' as ProjectId
  //   preview.open(viewId, projectId)
  // })

  const activeTextEditor = useActiveTextEditor()
  messenger.handleViewChange(async ({ projectId, viewId, change }, sender) => {
    try {
      logger.debug`request ${change.op} of ${viewId} in project ${projectId}`
      const result = await rpc.changeView({ viewId, projectId, change })

      if (!result.success) {
        output.error(`changeView failed\n${result.error}`)
        output.show()
        return result
      }
      const loc = result.location ?? null

      if (change.op === 'reset-manual-layout' || change.op === 'save-view-snapshot') {
        messenger.sendModelUpdate(sender)
        return { success: true }
      }
      if (!loc) {
        logger.warn(`rpc.changeView returned null`)
        return result
      }
      const location = rpc.client.protocol2CodeConverter.asLocation(loc)
      let viewColumn = activeTextEditor.value?.viewColumn ?? vscode.ViewColumn.One
      const selection = location.range
      const preserveFocus = viewColumn === vscode.ViewColumn.Beside
      const editor = await vscode.window.showTextDocument(location.uri, {
        viewColumn,
        selection,
        preserveFocus,
      })
      await vscode.workspace.save(location.uri)
      editor.revealRange(selection)
      return {
        success: true,
      }
    } catch (e) {
      const error = loggable(wrapError(e, 'changeView failed:\n'))
      output.error(error)
      output.show()
      return {
        success: false,
        error,
      }
    }
  })

  messenger.handleReadLocalIcon(async (uri) => {
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
  })

  return messenger
}
