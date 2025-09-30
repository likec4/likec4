import type {
  ComputedLikeC4ModelData,
  DeploymentFqn,
  DiagramView,
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

export const FetchDiagramView: RequestType<ViewId, {
  view: DiagramView | null
  error: string | null
}> = {
  method: 'fetch-diagram-view',
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

export type LocateParams =
  | {
    element: Fqn
    deployment?: never
    relation?: never
    view?: never
  }
  | {
    relation: RelationId
    deployment?: never
    element?: never
    view?: never
  }
  | {
    view: ViewId
    deployment?: never
    relation?: never
    element?: never
  }
  | {
    deployment: DeploymentFqn
    view?: never
    relation?: never
    element?: never
  }
