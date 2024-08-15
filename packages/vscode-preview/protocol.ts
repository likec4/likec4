import type { DiagramView, Fqn, RelationID, ViewChange, ViewID } from '@likec4/core'
import type { NotificationType, RequestType } from 'vscode-messenger-common'

export namespace ExtensionToPanel {
  export const diagramUpdate: NotificationType<{ view: DiagramView }> = { method: 'diagramUpdate' }
  export const error: NotificationType<{ error: string }> = { method: 'error' }
  export const getHoveredElement: RequestType<never, { elementId: Fqn | null }> = {
    method: 'getHoveredElement'
  }
}

export namespace WebviewToExtension {
  export const imReady: NotificationType<never> = { method: 'imReady' }
  export const openView: NotificationType<{ viewId: ViewID }> = { method: 'openView' }
  export const closeMe: NotificationType<never> = { method: 'closeMe' }

  export type WebviewState = {
    nodesDraggable: boolean
    edgesEditable: boolean
  }
  export const onWebviewStateChange: NotificationType<WebviewState> = { method: 'onWebviewStateChange' }

  export const onChange: NotificationType<{ viewId: ViewID; change: ViewChange }> = {
    method: 'onChange'
  }

  export type LocateParams =
    | {
      element: Fqn
      relation?: never
      view?: never
    }
    | {
      relation: RelationID
      element?: never
      view?: never
    }
    | {
      view: ViewID
      relation?: never
      element?: never
    }
  export const locate: NotificationType<LocateParams> = { method: 'locate' }
}
