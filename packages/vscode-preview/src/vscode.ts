import type {
  ComputedLikeC4ModelData,
  DiagramView,
  ProjectId,
  ViewChange,
  ViewId,
} from '@likec4/core/types'
import { CancellationTokenImpl, HOST_EXTENSION } from 'vscode-messenger-common'
import { Messenger } from 'vscode-messenger-webview'
import { type LocateParams, FetchComputedModel, FetchDiagramView, ReadLocalIcon, WebviewMsgs } from '../protocol'

export type VscodeState = {
  viewId: ViewId
  projectId: ProjectId
  view: DiagramView | null
  model: ComputedLikeC4ModelData | null
  nodesDraggable: boolean
  edgesEditable: boolean
  updatedAt: number
}
const vscode = acquireVsCodeApi<VscodeState>()

export const messenger = new Messenger(vscode)
messenger.start()

export const ExtensionApi = {
  navigateTo: (viewId: ViewId) => {
    messenger.sendNotification(WebviewMsgs.NavigateTo, HOST_EXTENSION, { viewId })
  },
  closeMe: () => {
    messenger.sendNotification(WebviewMsgs.CloseMe, HOST_EXTENSION)
  },
  locate: (params: LocateParams) => {
    messenger.sendNotification(WebviewMsgs.Locate, HOST_EXTENSION, params)
  },
  change: (viewId: ViewId, change: ViewChange) => {
    messenger.sendNotification(WebviewMsgs.OnChange, HOST_EXTENSION, { viewId, change })
  },

  fetchComputedModel: async (signal: AbortSignal) => {
    const cancellationToken = new CancellationTokenImpl()
    signal.onabort = () => cancellationToken.cancel()
    return await messenger.sendRequest(FetchComputedModel, HOST_EXTENSION, undefined, cancellationToken)
  },

  // Layoted vuew
  fetchDiagramView: async (viewId: ViewId, signal: AbortSignal) => {
    const cancellationToken = new CancellationTokenImpl()
    signal.onabort = () => cancellationToken.cancel()
    return await messenger.sendRequest(FetchDiagramView, HOST_EXTENSION, viewId, cancellationToken)
  },

  // Read local icon file and convert to base64 data URI
  readLocalIcon: async (uri: string) => {
    return await messenger.sendRequest(ReadLocalIcon, HOST_EXTENSION, uri)
  },
}

export function getVscodeState(): VscodeState {
  const state = vscode.getState()
  return {
    viewId: state?.viewId ?? __VIEW_ID as ViewId,
    projectId: state?.projectId ?? __PROJECT_ID as ProjectId,
    view: state?.view ?? null,
    model: state?.model ?? null,
    nodesDraggable: state?.nodesDraggable ?? __INTERNAL_STATE?.nodesDraggable ?? true,
    edgesEditable: state?.edgesEditable ?? __INTERNAL_STATE?.edgesEditable ?? true,
    updatedAt: state?.updatedAt ?? 0,
  }
}

export const saveVscodeState = (state: Partial<VscodeState>) => {
  vscode.setState({
    ...getVscodeState(),
    ...state,
    updatedAt: Date.now(),
  })
}
