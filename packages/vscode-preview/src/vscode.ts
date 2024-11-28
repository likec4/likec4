import { type DiagramView, type Fqn, type RelationId, type ViewChange, type ViewId } from '@likec4/core'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import { Messenger } from 'vscode-messenger-webview'
import { FetchComputedModel, FetchDiagramView, type LocateParams, WebviewMsgs } from '../protocol'

export type VscodeState = {
  viewId: ViewId
  view: DiagramView | null
  nodesDraggable: boolean
  edgesEditable: boolean
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

  fetchComputedModel: () => messenger.sendRequest(FetchComputedModel, HOST_EXTENSION),

  // Layoted vuew
  fetchDiagramView: (viewId: ViewId) => messenger.sendRequest(FetchDiagramView, HOST_EXTENSION, viewId)
}

export function getVscodeState(): VscodeState {
  const state = vscode.getState()
  return {
    viewId: state?.viewId ?? __VIEW_ID,
    view: state?.view ?? null,
    nodesDraggable: state?.nodesDraggable ?? __INTERNAL_STATE?.nodesDraggable ?? true,
    edgesEditable: state?.edgesEditable ?? __INTERNAL_STATE?.edgesEditable ?? true
  }
}

export const saveVscodeState = (state: Partial<VscodeState>) => {
  vscode.setState({
    ...getVscodeState(),
    ...state
  })
}
