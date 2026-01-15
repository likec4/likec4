import type { LayoutedProjectsView } from '@likec4/core'
import type {
  ComputedLikeC4ModelData,
  DiagramView,
  LayoutType,
  ProjectId,
  ViewChange,
  ViewId,
} from '@likec4/core/types'
import { CancellationTokenImpl, HOST_EXTENSION } from 'vscode-messenger-common'
import { Messenger } from 'vscode-messenger-webview'
import {
  type GetLastClickedNodeHandler,
  type Handler,
  type WebviewLocateReq,
  BroadcastModelUpdate,
  BroadcastProjectsUpdate,
  FetchComputedModel,
  FetchLayoutedView,
  FetchProjectsOverview,
  GetLastClickedNode,
  OnOpenView,
  ReadLocalIcon,
  ViewChangeReq,
  WebviewMsgs,
} from '../protocol'

export type VscodeState = {
  viewId: ViewId
  projectId: ProjectId
  view: DiagramView | null
  model: ComputedLikeC4ModelData | null
  nodesDraggable: boolean
  edgesEditable: boolean
  updatedAt: number
  screen: 'view' | 'projects'
  projectsOverview: LayoutedProjectsView | null
}
const vscode = acquireVsCodeApi<VscodeState>()

const messenger = new Messenger(vscode)
messenger.start()

export const ExtensionApi = {
  navigateTo: (viewId: ViewId, projectId?: ProjectId) => {
    messenger.sendNotification(WebviewMsgs.NavigateTo, HOST_EXTENSION, { screen: 'view', viewId, projectId })
  },
  navigateToProjectsOverview: () => {
    messenger.sendNotification(WebviewMsgs.NavigateTo, HOST_EXTENSION, { screen: 'projects' })
  },
  closeMe: () => {
    messenger.sendNotification(WebviewMsgs.CloseMe, HOST_EXTENSION)
  },
  locate: (params: WebviewLocateReq) => {
    messenger.sendNotification(WebviewMsgs.Locate, HOST_EXTENSION, params)
  },
  updateTitle: (title: string) => {
    messenger.sendNotification(WebviewMsgs.UpdateMyTitle, HOST_EXTENSION, { title })
  },

  change: async (params: {
    projectId: ProjectId
    viewId: ViewId
    change: ViewChange
  }) => {
    return await messenger.sendRequest(ViewChangeReq, HOST_EXTENSION, params)
  },

  fetchComputedModel: async (projectId: ProjectId, signal: AbortSignal) => {
    const cancellationToken = new CancellationTokenImpl()
    signal.onabort = () => cancellationToken.cancel()
    return await messenger.sendRequest(FetchComputedModel, HOST_EXTENSION, { projectId }, cancellationToken)
  },

  // Layoted vuew
  fetchDiagramView: async (params: {
    projectId: ProjectId
    viewId: ViewId
    layoutType: LayoutType
  }, signal: AbortSignal) => {
    const cancellationToken = new CancellationTokenImpl()
    signal.onabort = () => cancellationToken.cancel()
    return await messenger.sendRequest(FetchLayoutedView, HOST_EXTENSION, params, cancellationToken)
  },

  fetchProjectsOverview: async (signal: AbortSignal) => {
    const cancellationToken = new CancellationTokenImpl()
    signal.onabort = () => cancellationToken.cancel()
    return await messenger.sendRequest(
      FetchProjectsOverview,
      HOST_EXTENSION,
      undefined,
      cancellationToken,
    )
  },

  // Read local icon file and convert to base64 data URI
  readLocalIcon: async (uri: string) => {
    return await messenger.sendRequest(ReadLocalIcon, HOST_EXTENSION, uri)
  },

  onOpenViewNotification: (handler: Handler<typeof OnOpenView>) => {
    messenger.onNotification(OnOpenView, handler)
  },

  onGetLastClickedNodeRequest: (handler: GetLastClickedNodeHandler) => {
    messenger.onRequest(GetLastClickedNode, handler)
  },

  onModelUpdateNotification: (handler: () => void) => {
    messenger.onNotification(BroadcastModelUpdate, handler)
  },

  onProjectsUpdateNotification: (handler: () => void) => {
    messenger.onNotification(BroadcastProjectsUpdate, handler)
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
    screen: state?.screen ?? __SCREEN,
    projectsOverview: state?.projectsOverview ?? null,
  }
}

export const saveVscodeState = (state: Partial<VscodeState>) => {
  vscode.setState({
    ...getVscodeState(),
    ...state,
    updatedAt: Date.now(),
  })
}
