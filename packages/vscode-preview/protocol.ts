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

export const OnOpenView: NotificationType<{ viewId: ViewId; projectId: ProjectId }> = {
  method: 'on-open-view',
}

export const GetLastClickedNode: RequestType<never, { element: Fqn | null; deployment: DeploymentFqn | null }> = {
  method: 'get-last-clicked-node',
}

export const ReadLocalIcon: RequestType</* uri */ string, {
  base64data: string | null
}> = {
  method: 'read-local-icon',
}

export const WebviewMsgs = {
  CloseMe: { method: 'webview:closeMe' } as NotificationType<never>,
  Locate: { method: 'webview:locate' } as NotificationType<LocateParams>,
  NavigateTo: { method: 'webview:navigate' } as NotificationType<{ viewId: ViewId }>,
  OnChange: { method: 'webview:change' } as NotificationType<{ viewId: ViewId; change: ViewChange }>,
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
