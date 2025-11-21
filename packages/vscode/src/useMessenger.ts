import {
  type OnOpenViewPayload,
  BroadcastModelUpdate,
  FetchComputedModel,
  FetchLayoutedView,
  GetLastClickedNode,
  OnOpenView,
  ReadLocalIcon,
  ViewChangeReq,
  WebviewMsgs,
} from '@likec4/vscode-preview/protocol'
import {
  createSingletonComposable,
  useDisposable,
} from 'reactive-vscode'
import type { IsNever } from 'type-fest'
import * as vscode from 'vscode'
import { Messenger } from 'vscode-messenger'
import {
  type CancellationToken,
  type MessageParticipant,
  type NotificationType,
  type RequestType,
  BROADCAST,
} from 'vscode-messenger-common'
import { useExtensionLogger } from './useExtensionLogger'

export const useMessenger = createSingletonComposable(() => {
  const { logger } = useExtensionLogger('messenger')
  const messenger = new Messenger()

  const requestHandler =
    <P, R>(reqType: RequestType<P, R>) =>
    (handler: (params: P, sender: MessageParticipant, cancelable: CancellationToken) => Promise<R>) => {
      return useDisposable(
        messenger.onRequest(
          reqType,
          async (params: P, sender: MessageParticipant, cancelable: vscode.CancellationToken) => {
            try {
              return await Promise.resolve().then(() => handler(params, sender, cancelable))
            } catch (err) {
              logger.warn(`request {req} failed`, { req: reqType.method, err })
              throw err // propagate to client
            }
          },
        ),
      )
    }

  const notificationHandler = <P>(notiType: NotificationType<P>) =>
  (
    handler: (params: P, sender: MessageParticipant) => void | Promise<void>,
  ) => {
    return useDisposable(
      messenger.onNotification(notiType, async (params: P, sender: MessageParticipant) => {
        try {
          await Promise.resolve().then(() => handler(params, sender))
        } catch (err) {
          logger.warn(`notification {noti} failed`, { noti: notiType.method, err })
          throw err // propagate to client
        }
      }),
    )
  }

  // dprint-ignore
  type ReqOp<P, R> =
    IsNever<P> extends true
      ? ((receiver: MessageParticipant) => Promise<R>)
      : ((receiver: MessageParticipant, params: P) => Promise<R>)
  const sendRequest =
    <P, R>(reqType: RequestType<P, R>): ReqOp<P, R> => async (receiver: MessageParticipant, params?: P) => {
      try {
        return await messenger.sendRequest(reqType, receiver, params)
      } catch (err) {
        logger.warn(`sendRequest {req} failed`, { req: reqType.method, err })
        throw err
      }
    }

  // dprint-ignore
  type NotifyOp<P> =
    IsNever<P> extends true
      ? ((receiver: MessageParticipant) => void)
      : ((receiver: MessageParticipant, params: P) => void)
  const sendNotification =
    <P>(notiType: NotificationType<P>): NotifyOp<P> => (receiver: MessageParticipant, params?: P) => {
      try {
        return messenger.sendNotification(notiType, receiver, params)
      } catch (err) {
        logger.warn(`sendNotification {noti} failed`, { noti: notiType.method, err })
        throw err
      }
    }

  const protocol = {
    handleFetchComputedModel: requestHandler(FetchComputedModel),
    handleFetchLayoutedView: requestHandler(FetchLayoutedView),
    handleReadLocalIcon: requestHandler(ReadLocalIcon),
    handleViewChange: requestHandler(ViewChangeReq),

    onWebviewCloseMe: notificationHandler(WebviewMsgs.CloseMe),
    onWebviewLocate: notificationHandler(WebviewMsgs.Locate),
    onWebviewNavigateTo: notificationHandler(WebviewMsgs.NavigateTo),

    sendOpenView: sendNotification(OnOpenView),
    sendModelUpdate: sendNotification(BroadcastModelUpdate),
    requestGetLastClickedNode: sendRequest(GetLastClickedNode),
  }

  return {
    messenger,

    broadcastModelUpdate: () => {
      logger.debug`broadcast ${'onDidChangeModel'}`
      messenger.sendNotification(BroadcastModelUpdate, BROADCAST)
    },

    ...protocol,

    registerPanel: (panel: vscode.WebviewPanel) => {
      const participant = messenger.registerWebviewPanel(panel)
      return {
        participant,
        sendOpenView: (payload: OnOpenViewPayload) => protocol.sendOpenView(participant, payload),
        sendModelUpdate: () => protocol.sendModelUpdate(participant),
      }
    },
  }
})

// export function activateMessenger({
//   rpc,
//   preview,
//   messenger,
// }: { rpc: Rpc; preview: DiagramPanel; messenger: Messenger }) {
//   const { logger } = useExtensionLogger('messenger')

//   logger.debug('useMessenger activation')

//   const broadcastModelUpdate = () => {
//     logger.debug`broadcast ${'onDidChangeModel'}`
//     messenger.sendNotification(BroadcastModelUpdate, BROADCAST)
//   }

//   rpc.onDidChangeModel(() => {
//     broadcastModelUpdate()
//   })

//   rpc.onRequestOpenView((params) => {
//     logger.debug`request open view ${params.viewId} of project ${params.projectId}`
//     preview.open(params.viewId, params.projectId)
//   })

//   const activeTextEditor = useActiveTextEditor()

//   useDisposable(messenger.onRequest(FetchComputedModel, async () => {
//     const t0 = performanceMark()
//     const projectId = toValue(preview.projectId) ?? 'default'
//     try {
//       const result = await rpc.fetchComputedModel(projectId)
//       logger.debug(`request {req} of {projectId} in ${t0.pretty}`, { req: 'fetchComputedModel', projectId })
//       if (result.model) {
//         computedModels.value[projectId] = result.model
//         void nextTick(() => {
//           triggerRef(computedModels)
//         })
//       }
//       return result
//     } catch (err) {
//       logger.warn(`request {req} of {projectId} failed after ${t0.pretty}`, {
//         req: 'fetchComputedModel',
//         projectId,
//         err,
//       })
//       throw err // propagate to client
//     }
//   }))

//   useDisposable(messenger.onRequest(FetchLayoutedView, async (params) => {
//     const t0 = performanceMark()
//     const { viewId, layoutType = 'manual' } = params
//     try {
//       const projectId = toValue(preview.projectId) ?? 'default'
//       const result = await rpc.layoutView({ viewId, projectId })
//       if (!result) {
//         return {
//           view: null,
//           error: `View "${viewId}" not found`,
//         }
//       }
//       let view = result.diagram
//       const modelData = computedModels.value[projectId]
//       const snapshot = modelData?.manualLayouts?.[viewId]
//       if (snapshot) {
//         if (layoutType === 'auto') {
//           view = applyLayoutDriftReasons(view, snapshot)
//         } else if (view._layout !== 'manual') {
//           view = applyManualLayout(view, snapshot)
//         }
//       }
//       logger.debug(
//         `{req} of {viewId} in {projectId} (requested: {layoutType}, actual: {viewlayout}) in ${t0.pretty}`,
//         { req: 'layoutView', viewId, projectId, layoutType, viewlayout: view._layout },
//       )

//       return {
//         view,
//         error: null,
//       }
//     } catch (err) {
//       logger.warn(`request {req} of {viewId} failed after ${t0.pretty}`, { req: 'layoutView', err, viewId })
//       const error = loggable(err)
//       return {
//         view: null,
//         error,
//       }
//     }
//   }))

//   useDisposable(messenger.onNotification(WebviewMsgs.CloseMe, () => {
//     preview.close()
//   }))

//   useDisposable(messenger.onNotification(WebviewMsgs.Locate, async (params) => {
//     const projectId = toValue(preview.projectId) ?? 'default' as ProjectId
//     await executeCommand(commands.locate, { ...params, projectId })
//   }))

//   useDisposable(messenger.onNotification(WebviewMsgs.NavigateTo, ({ viewId }) => {
//     const projectId = toValue(preview.projectId) ?? 'default' as ProjectId
//     preview.open(viewId, projectId)
//   }))

//   useDisposable(messenger.onNotification(WebviewMsgs.OnChange, async ({ viewId, change }) => {
//     try {
//       const projectId = toValue(preview.projectId) ?? 'default' as ProjectId
//       logger.debug`request ${change.op} of ${viewId} in project ${projectId}`
//       let loc = await rpc.changeView({ viewId, projectId, change })
//       if (change.op === 'reset-manual-layout' || change.op === 'save-view-snapshot') {
//         latestUpdatedSnapshotUri.value = loc?.uri ?? null
//         broadcastModelUpdate()
//         return
//       }
//       if (!loc) {
//         logger.warn(`rpc.changeView returned null`)
//         return
//       }
//       const location = rpc.client.protocol2CodeConverter.asLocation(loc)
//       let viewColumn = activeTextEditor.value?.viewColumn ?? vscode.ViewColumn.One
//       const selection = location.range
//       const preserveFocus = viewColumn === vscode.ViewColumn.Beside
//       const editor = await vscode.window.showTextDocument(location.uri, {
//         viewColumn,
//         selection,
//         preserveFocus,
//       })
//       await vscode.workspace.save(location.uri)
//       editor.revealRange(selection)
//     } catch (error) {
//       logger.error(`[Messenger] onChange error`, { error })
//       throw error // propagate to client
//     }
//   }))

//   useDisposable(messenger.onRequest(ReadLocalIcon, async (uri) => {
//     const t0 = performanceMark()
//     try {
//       // Convert file:// URI to vscode.Uri
//       const fileUri = vscode.Uri.parse(uri)

//       // Read the file using VSCode filesystem API
//       const fileData = await vscode.workspace.fs.readFile(fileUri)

//       // Convert to base64
//       const base64data = Buffer.from(fileData).toString('base64')

//       // Determine MIME type based on file extension
//       const ext = fileUri.path.toLowerCase().split('.').pop()
//       let mimeType = 'image/png' // default
//       switch (ext) {
//         case 'jpg':
//         case 'jpeg':
//           mimeType = 'image/jpeg'
//           break
//         case 'png':
//           mimeType = 'image/png'
//           break
//         case 'gif':
//           mimeType = 'image/gif'
//           break
//         case 'svg':
//           mimeType = 'image/svg+xml'
//           break
//         case 'webp':
//           mimeType = 'image/webp'
//           break
//       }

//       const dataUri = `data:${mimeType};base64,${base64data}`

//       logger.debug(`request {req} for {uri} in ${t0.pretty}`, { req: 'readLocalIcon', uri })
//       return { base64data: dataUri }
//     } catch (err) {
//       logger.warn(`request {req} for {uri} failed after ${t0.pretty}`, { req: 'readLocalIcon', uri, err })
//       // Return null for any errors (file not found, permission denied, etc.)
//       return { base64data: null }
//     }
//   }))
// }
