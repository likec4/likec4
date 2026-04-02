import { loggable, wrapError } from '@likec4/log'
import {
  executeCommand,
  toValue,
} from 'reactive-vscode'
import vscode from 'vscode'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import { useMessenger } from '../useMessenger'
import { useRpc } from '../useRpc'
import { performanceMark, showEditorNextToPreview } from '../utils'
import { useDiagramPanel } from './useDiagramPanel'

export function activateMessenger() {
  const rpc = useRpc()
  const messenger = useMessenger()
  const preview = useDiagramPanel()

  const { logger, output } = useExtensionLogger('messenger')

  logger.debug('activating messenger <-> preview panel')

  messenger.handleFetchComputedModel(async ({ projectId }) => {
    const t0 = performanceMark()
    const req = 'fetchComputedModel'
    try {
      const { model } = await rpc.fetchComputedModel(projectId)
      if (model) {
        logger.debug(`{req} of {projectId} in ${t0.pretty}`, { req, projectId })
      } else {
        logger.warn(`No data returned in request {req} for {projectId} in ${t0.pretty}`, {
          req,
          projectId,
        })
      }
      return {
        model,
        error: null,
      }
    } catch (err) {
      logger.warn(`{req} of {projectId} failed after ${t0.pretty}`, {
        req,
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
    const req = 'layoutView'
    const { viewId, layoutType = 'manual' } = params
    try {
      const projectId = params.projectId ?? toValue(preview.projectId) ?? 'default'
      const result = await rpc.layoutView({ viewId, projectId, layoutType })
      if (!result) {
        logger.warn(
          `no view {viewId} found (or layout failed) in {projectId} ${t0.pretty}`,
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
        { req, viewId, projectId, layoutType, viewlayout: view._layout },
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
    const req = 'fetchProjectsOverview'
    try {
      const result = await rpc.fetchProjectsOverview()
      logger.debug(`{req} in ${t0.pretty}`, { req })
      return result
    } catch (err) {
      logger.warn(`{req} failed after ${t0.pretty}`, { req, err })
      throw err // propagate to client
    }
  })

  messenger.onWebviewLocate(async (params) => {
    await executeCommand(commands.locate, params)
  })

  messenger.handleViewChange(async ({ projectId, viewId, change }) => {
    try {
      logger.debug`request ${change.op} of ${viewId} in project ${projectId}`
      const result = await rpc.changeView({ viewId, projectId, change })

      if (!result.success) {
        // direct output to bypass telemetry error
        output.error(result.error)
        output.show()
        return result
      }
      // For save-view-snapshot, we don't need to navigate
      if (change.op === 'reset-manual-layout' || change.op === 'save-view-snapshot') {
        return { success: true }
      }
      const loc = result.location ?? null
      if (!loc) {
        logger.warn(`rpc.changeView returned null`)
        return result
      }
      const location = rpc.client.protocol2CodeConverter.asLocation(loc)
      await showEditorNextToPreview({
        previewColumn: toValue(preview.panelViewColumn),
        location,
        preserveFocus: true,
      })
      await vscode.workspace.save(location.uri)
      return {
        success: true,
      }
    } catch (e) {
      // direct output to bypass telemetry error
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
    const req = 'readLocalIcon'
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

      logger.debug(`{req} of {uri} in ${t0.pretty}`, { req, uri })
      return { base64data: dataUri }
    } catch (err) {
      logger.warn(`{req} of {uri} failed after ${t0.pretty}`, { req, uri, err })
      // Return null for any errors (file not found, permission denied, etc.)
      return { base64data: null }
    }
  })

  return messenger
}
