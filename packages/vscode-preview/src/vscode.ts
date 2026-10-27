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
  BroadcastAILayoutStateUpdate,
  BroadcastModelUpdate,
  BroadcastProjectsUpdate,
  FetchComputedModel,
  FetchLayoutedView,
  FetchProjectsOverview,
  GetLastClickedNode,
  OnOpenView,
  ReadBootstrapIcon,
  ReadLocalIcon,
  ViewChangeReq,
  WebviewMsgs,
} from '../protocol'
import type { queries } from './queries'

export type VscodeState =
  & {
    viewId: ViewId
    projectId: ProjectId
    model: ComputedLikeC4ModelData | null
    nodesDraggable: boolean
    edgesEditable: boolean
    updatedAt: number
    screen: 'view' | 'projects'
  }
  & (
    | {
      view: null
      viewQueryKey: null
    }
    | {
      view: DiagramView
      viewQueryKey: ReturnType<typeof queries.fetchDiagramView>['queryKey']
    }
  )

const vscode = acquireVsCodeApi<VscodeState>()

const messenger = new Messenger(vscode)
messenger.start()

function cancelTokenFromSignal(signal: AbortSignal) {
  const cancelToken = new CancellationTokenImpl()
  if (signal.aborted) {
    cancelToken.cancel()
  }
  const triggerCancel = () => cancelToken.cancel()
  signal.addEventListener('abort', triggerCancel)
  const cleanup = () => signal.removeEventListener('abort', triggerCancel)
  return { cancelToken, cleanup }
}

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
  openExternalUrl: (url: string) => {
    messenger.sendNotification(WebviewMsgs.OpenExternalUrl, HOST_EXTENSION, { url })
  },
  updateTitle: (title: string) => {
    messenger.sendNotification(WebviewMsgs.UpdateMyTitle, HOST_EXTENSION, { title })
  },

  applySemanticLayout: (viewId: ViewId) => {
    if (__HAS_AI) {
      messenger.sendNotification(WebviewMsgs.SemanticLayout, HOST_EXTENSION, { viewId })
    }
  },

  change: async (params: {
    projectId: ProjectId
    viewId: ViewId
    change: ViewChange
  }): Promise<
    | { success: true }
    | { success: false; error: string }
  > => {
    return await messenger.sendRequest(ViewChangeReq, HOST_EXTENSION, params)
  },

  fetchComputedModel: async (
    projectId: ProjectId,
    signal: AbortSignal,
  ): Promise<{
    model: ComputedLikeC4ModelData | null
    error: string | null
  }> => {
    const { cancelToken, cleanup } = cancelTokenFromSignal(signal)
    try {
      return await messenger.sendRequest(FetchComputedModel, HOST_EXTENSION, { projectId }, cancelToken)
    } finally {
      cleanup()
    }
  },

  // Layoted vuew
  fetchDiagramView: async (
    params: {
      projectId: ProjectId
      viewId: ViewId
      layoutType: LayoutType
    },
    signal: AbortSignal,
  ): Promise<{
    view: DiagramView | null
    error: string | null
  }> => {
    const { cancelToken, cleanup } = cancelTokenFromSignal(signal)
    try {
      return await messenger.sendRequest(FetchLayoutedView, HOST_EXTENSION, params, cancelToken)
    } finally {
      cleanup()
    }
  },

  fetchProjectsOverview: async (signal: AbortSignal): Promise<{
    projectsView: LayoutedProjectsView | null
  }> => {
    const { cancelToken, cleanup } = cancelTokenFromSignal(signal)
    try {
      return await messenger.sendRequest(
        FetchProjectsOverview,
        HOST_EXTENSION,
        undefined,
        cancelToken,
      )
    } finally {
      cleanup()
    }
  },

  // Read local icon file and convert to base64 data URI
  readLocalIcon: async (uri: string) => {
    return await messenger.sendRequest(ReadLocalIcon, HOST_EXTENSION, uri)
  },

  readBootstrapIcon: async (name: string) => {
    return await messenger.sendRequest(ReadBootstrapIcon, HOST_EXTENSION, name)
  },

  onOpenViewNotification: (handler: Handler<typeof OnOpenView>) => {
    messenger.onNotification(OnOpenView, handler)
  },

  onAiLayoutUpdateNotification: (handler: Handler<typeof BroadcastAILayoutStateUpdate>) => {
    messenger.onNotification(BroadcastAILayoutStateUpdate, handler)
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
  const viewQueryKey = state?.viewQueryKey ?? null
  const view = state?.view ?? null
  return {
    viewId: state?.viewId ?? __VIEW_ID as ViewId,
    projectId: state?.projectId ?? __PROJECT_ID as ProjectId,
    ...(!!view && !!viewQueryKey ? { view, viewQueryKey } : {
      view: null,
      viewQueryKey: null,
    }),
    model: state?.model ?? null,
    nodesDraggable: state?.nodesDraggable ?? __INTERNAL_STATE?.nodesDraggable ?? true,
    edgesEditable: state?.edgesEditable ?? __INTERNAL_STATE?.edgesEditable ?? true,
    updatedAt: state?.updatedAt ?? 0,
    screen: state?.screen ?? __SCREEN,
  }
}

export const saveVscodeState = (state: Partial<VscodeState>) => {
  vscode.setState({
    ...getVscodeState(),
    ...state,
    updatedAt: Date.now(),
  } as VscodeState)
}
