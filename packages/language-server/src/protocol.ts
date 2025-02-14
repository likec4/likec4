import type {
  ComputedLikeC4Model,
  ComputedView,
  DiagramView,
  Fqn,
  ParsedLikeC4Model,
  RelationId,
  ViewChange,
  ViewId,
} from '@likec4/core'
import { NotificationType, RequestType, RequestType0 } from 'vscode-jsonrpc'
import type { DiagnosticSeverity, DocumentUri, Location, Position } from 'vscode-languageserver-types'

// #region From server
export const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
export type OnDidChangeModelNotification = typeof onDidChangeModel
// #endregion

// #region To server

export const fetchModel = new RequestType0<{ model: ParsedLikeC4Model | null }, void>(
  'likec4/fetchModel',
)
export type FetchModelRequest = typeof fetchModel

export const fetchComputedModel = new RequestType<
  { cleanCaches?: boolean | undefined },
  { model: ComputedLikeC4Model | null },
  void
>(
  'likec4/fetchComputedModel',
)
export type FetchComputedModelRequest = typeof fetchComputedModel

export const computeView = new RequestType<{ viewId: ViewId }, { view: ComputedView | null }, void>(
  'likec4/computeView',
)
export type ComputeViewRequest = typeof computeView

/**
 * Request to layout a view.
 */
export const layoutView = new RequestType<
  { viewId: ViewId },
  {
    result:
      | {
        dot: string
        diagram: DiagramView
      }
      | null
  },
  void
>('likec4/layout-view')
export type LayoutViewRequest = typeof layoutView

/**
 * Request to layout all existing views.
 */
export const validateLayout = new RequestType<
  {},
  {
    result:
      | {
        uri: string
        viewId: ViewId
        message: string
        severity: DiagnosticSeverity
        range: { start: Position; end: Position }
      }[]
      | null
  },
  void
>('likec4/validate-layout')
export type ValidateLayoutRequest = typeof validateLayout

/**
 * Request to build documents.
 */
export interface BuildDocumentsParams {
  docs: DocumentUri[]
}
export const buildDocuments = new RequestType<BuildDocumentsParams, void, void>('likec4/build')
export type BuildDocumentsRequest = typeof buildDocuments

/**
 * Request to locate an element, relation, deployment or view.
 */
export type LocateParams =
  | {
    element: Fqn
    property?: string
  }
  | {
    relation: RelationId
  }
  | {
    deployment: Fqn
    property?: string
  }
  | {
    view: ViewId
  }
export const locate = new RequestType<LocateParams, Location | null, void>('likec4/locate')
export type LocateRequest = typeof locate
// #endregion

export interface ChangeViewRequestParams {
  viewId: ViewId
  change: ViewChange
}
export const changeView = new RequestType<ChangeViewRequestParams, Location | null, void>('likec4/change-view')
export type ChangeViewRequest = typeof changeView
