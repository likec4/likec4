import type {
  ComputedLikeC4ModelData,
  DeploymentFqn,
  DiagramView,
  ExclusiveUnion,
  Fqn,
  LayoutedProjectsView,
  ProjectId,
  RelationId,
  ViewChange,
  ViewId,
} from '@likec4/core'

import type { NotificationType, RequestType } from 'vscode-messenger-common'

/**
 * Notification sent from the extension to the webview when the model is updated.
 */
export const BroadcastModelUpdate: NotificationType<never> = {
  method: 'model-update',
}

/**
 * Notification sent from the extension to the webview when the projects are updated.
 */
export const BroadcastProjectsUpdate: NotificationType<never> = {
  method: 'projects-updated',
}

export const FetchComputedModel: RequestType<never, { model: ComputedLikeC4ModelData | null }> = {
  method: 'fetch-computed-model',
}

export const FetchLayoutedView: RequestType<{
  viewId: ViewId
  // by default, prefers manual layout if available
  layoutType?: 'manual' | 'auto'
}, {
  view: DiagramView | null
  error: string | null
}> = {
  method: 'fetch-layouted-view',
}

export const FetchProjectsOverview: RequestType<never, { projectsView: LayoutedProjectsView | null }> = {
  method: 'fetch-projects-overview',
}

export type OpenViewPayload = {
  screen: 'view'
  viewId: ViewId
  projectId: ProjectId
} | {
  screen: 'projects'
  viewId?: never
  projectId?: never
}
export const OnOpenView: NotificationType<OpenViewPayload> = {
  method: 'on-open-view',
}

export type GetLastClickedNodeResult = {
  element: Fqn | null
  deployment: DeploymentFqn | null
}
export const GetLastClickedNode: RequestType<never, GetLastClickedNodeResult> = {
  method: 'get-last-clicked-node',
}
export type GetLastClickedNodeHandler = () => GetLastClickedNodeResult

export type ReadLocalIconResult = {
  base64data: string | null
}
export const ReadLocalIcon: RequestType</* uri */ string, ReadLocalIconResult> = {
  method: 'read-local-icon',
}

export const ViewChangeReq = { method: 'webview:change' } as RequestType<
  { viewId: ViewId; change: ViewChange },
  { success: true } | { success: false; error: string }
>

export const WebviewMsgs = {
  CloseMe: { method: 'webview:closeMe' } as NotificationType<never>,
  Locate: { method: 'webview:locate' } as NotificationType<LocateParams>,
  NavigateTo: { method: 'webview:navigate' } as NotificationType<
    | { screen: 'view'; viewId: ViewId; projectId: ProjectId | undefined }
    | { screen: 'projects' }
  >,
  UpdateMyTitle: { method: 'webview:update-my-title' } as NotificationType<{ title: string }>,
}

export type LocateParams = ExclusiveUnion<{
  Element: {
    element: Fqn
  }
  Relation: {
    relation: RelationId
  }
  DynamicViewStep: {
    view: ViewId
    astPath: string
  }
  View: {
    view: ViewId
  }
  Deployment: {
    deployment: DeploymentFqn
  }
}>

export type Handler<T> =
  // dprint-ignore
  T extends RequestType<infer P, infer Res>
    ? (params: P) => Promise<Res>
    : T extends NotificationType<infer P>
      ? (payload: P) => void
      : never
