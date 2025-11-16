import type {
  ComputedLikeC4ModelData,
  DeploymentFqn,
  DiagramView,
  ExclusiveUnion,
  Fqn,
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

export type OnOpenViewPayload = {
  viewId: ViewId
  projectId: ProjectId
}
export const OnOpenView: NotificationType<OnOpenViewPayload> = {
  method: 'on-open-view',
}
// export type OnOpenViewHandler = (notification: OnOpenViewPayload) => voi

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
  NavigateTo: { method: 'webview:navigate' } as NotificationType<{ viewId: ViewId }>,
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
