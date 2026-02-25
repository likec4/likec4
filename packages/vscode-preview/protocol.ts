// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

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

export const FetchComputedModel: RequestType<{
  projectId: ProjectId
}, {
  model: ComputedLikeC4ModelData | null
  error: string | null
}> = {
  method: 'fetch-computed-model',
}

export const FetchLayoutedView: RequestType<{
  projectId: ProjectId
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
  { projectId: ProjectId; viewId: ViewId; change: ViewChange },
  { success: true } | { success: false; error: string }
>

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
export type WebviewLocateReq = { projectId: ProjectId } & LocateParams

export const WebviewMsgs = {
  CloseMe: { method: 'webview:closeMe' } as NotificationType<never>,
  Locate: { method: 'webview:locate' } as NotificationType<WebviewLocateReq>,
  NavigateTo: { method: 'webview:navigate' } as NotificationType<
    | { screen: 'view'; viewId: ViewId; projectId: ProjectId | undefined }
    | { screen: 'projects' }
  >,
  UpdateMyTitle: { method: 'webview:update-my-title' } as NotificationType<{ title: string }>,
}

// AI Chat proxy protocol — routes fetch requests through the extension host
// to bypass CORS restrictions in the webview.

export type AIChatProxyStartParams = {
  url: string
  method: string
  headers: Record<string, string>
  body: string
}

export type AIChatProxyStartResult = {
  streamId: string
  status: number
  ok: boolean
  errorBody?: string
}

export const AIChatProxyStart: RequestType<AIChatProxyStartParams, AIChatProxyStartResult> = {
  method: 'ai-chat:proxy-start',
}

export const AIChatProxyChunk: NotificationType<{ streamId: string; chunk: string }> = {
  method: 'ai-chat:proxy-chunk',
}

export const AIChatProxyDone: NotificationType<{ streamId: string }> = {
  method: 'ai-chat:proxy-done',
}

export const AIChatProxyError: NotificationType<{ streamId: string; error: string }> = {
  method: 'ai-chat:proxy-error',
}

export const AIChatProxyCancel: NotificationType<{ streamId: string }> = {
  method: 'ai-chat:proxy-cancel',
}

export type Handler<T> =
  // dprint-ignore
  T extends RequestType<infer P, infer Res>
    ? (params: P) => Promise<Res>
    : T extends NotificationType<infer P>
      ? (payload: P) => void
      : never
