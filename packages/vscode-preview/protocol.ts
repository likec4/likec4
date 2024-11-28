import type { ComputedLikeC4Model, DiagramView, Fqn, RelationId, ViewChange, ViewId } from '@likec4/core'
import type { NotificationType, RequestType } from 'vscode-messenger-common'

/**
 * Notification sent from the extension to the webview when the model is updated.
 */
export const BroadcastModelUpdate: NotificationType<never> = {
  method: 'model-update'
}

export const FetchComputedModel: RequestType<never, { model: ComputedLikeC4Model | null }> = {
  method: 'fetch-computed-model'
}

export const FetchDiagramView: RequestType<ViewId, {
  view: DiagramView | null
  error: string | null
}> = {
  method: 'fetch-diagram-view'
}

export const OnOpenView: NotificationType<{ viewId: ViewId }> = {
  method: 'on-open-view'
}

export const GetLastClickedNode: RequestType<never, { elementId: Fqn | null }> = {
  method: 'get-last-clicked-node'
}

export const WebviewMsgs = {
  CloseMe: { method: 'webview:closeMe' } as NotificationType<never>,
  Locate: { method: 'webview:locate' } as NotificationType<LocateParams>,
  NavigateTo: { method: 'webview:navigate' } as NotificationType<{ viewId: ViewId }>,
  OnChange: { method: 'webview:change' } as NotificationType<{ viewId: ViewId; change: ViewChange }>
}

// export namespace ExtensionToPanel {

//   // export const ComputedModelUpdated: NotificationType<{ model: ComputedLikeC4Model }> = {
//   //   method: 'computed-model-updated'
//   // }
//   // export const DiagramViewUpdated: NotificationType<{ view: DiagramView }> = {
//   //   method: 'diagram-view-updated'
//   // }
//   export const DiagramViewError: NotificationType<{
//     id: ViewID
//     error: string
//   }> = {
//     method: 'diagram-view-error'
//   }

//   export const diagramUpdate: NotificationType<{ view: DiagramView }> = { method: 'diagramUpdate' }
//   export const error: NotificationType<{ error: string }> = { method: 'error' }
//
// }

// export namespace WebviewToExtension {

//   export const imReady: NotificationType<never> = { method: 'imReady' }
//   export const openView: NotificationType<{ viewId: ViewID }> = { method: 'openView' }
//   export const closeMe: NotificationType<never> = { method: 'closeMe' }

//   export type WebviewState = {
//     nodesDraggable: boolean
//     edgesEditable: boolean
//   }
//   export const onWebviewStateChange: NotificationType<WebviewState> = { method: 'onWebviewStateChange' }

//   export const onChange: NotificationType<{ viewId: ViewID; change: ViewChange }> = {
//     method: 'onChange'
//   }

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
    deployment: Fqn
    view?: never
    relation?: never
    element?: never
  }

// }
