import { type DiagramView, type Fqn, type RelationID, type ViewChange, type ViewID } from '@likec4/core'
import { HOST_EXTENSION } from 'vscode-messenger-common'
import { Messenger } from 'vscode-messenger-webview'
import { FetchComputedModel, FetchDiagramView, type LocateParams, WebviewMsgs } from '../protocol'

export type VscodeState = {
  viewId: ViewID
  view: DiagramView | null
  nodesDraggable: boolean
  edgesEditable: boolean
}
const vscode = acquireVsCodeApi<VscodeState>()

export const messenger = new Messenger(vscode)
messenger.start()

export const ExtensionApi = {
  navigateTo: (viewId: ViewID) => {
    messenger.sendNotification(WebviewMsgs.NavigateTo, HOST_EXTENSION, { viewId })
  },
  closeMe: () => {
    messenger.sendNotification(WebviewMsgs.CloseMe, HOST_EXTENSION)
  },
  locate: (params: LocateParams) => {
    messenger.sendNotification(WebviewMsgs.Locate, HOST_EXTENSION, params)
  },
  change: (viewId: ViewID, change: ViewChange) => {
    messenger.sendNotification(WebviewMsgs.OnChange, HOST_EXTENSION, { viewId, change })
  },

  fetchComputedModel: () => messenger.sendRequest(FetchComputedModel, HOST_EXTENSION),

  // Layoted vuew
  fetchDiagramView: (viewId: ViewID) => messenger.sendRequest(FetchDiagramView, HOST_EXTENSION, viewId),

  goToElement: (element: Fqn) => {
    ExtensionApi.locate({ element })
  },

  goToRelation: (relation: RelationID) => {
    ExtensionApi.locate({ relation })
  },

  goToViewSource: (view: ViewID) => {
    ExtensionApi.locate({ view })
  }
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
