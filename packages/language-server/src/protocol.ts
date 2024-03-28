import type {
  AutoLayoutDirection,
  ComputedView,
  ElementShape,
  Fqn,
  LikeC4ComputedModel,
  LikeC4Model,
  NonEmptyArray,
  RelationID,
  ThemeColor,
  ViewID
} from '@likec4/core'
import type { DocumentUri, Location } from 'vscode-languageserver-protocol'
import { NotificationType, RequestType, RequestType0 } from 'vscode-languageserver-protocol'

// #region From server
export const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
export type OnDidChangeModelNotification = typeof onDidChangeModel
// #endregion

// #region To server
export const fetchModel = new RequestType0<{ model: LikeC4Model | null }, void>(
  'likec4/fetchModel'
)
export type FetchModelRequest = typeof fetchModel

export const fetchComputedModel = new RequestType0<{ model: LikeC4ComputedModel | null }, void>(
  'likec4/fetchComputedModel'
)
export type FetchComputedModelRequest = typeof fetchComputedModel

export const computeView = new RequestType<{ viewId: ViewID }, { view: ComputedView | null }, void>(
  'likec4/computeView'
)
export type ComputeViewRequest = typeof computeView

export interface BuildDocumentsParams {
  docs: DocumentUri[]
}
export const buildDocuments = new RequestType<BuildDocumentsParams, void, void>('likec4/build')
export type BuildDocumentsRequest = typeof buildDocuments

export type LocateParams =
  | {
    element: Fqn
    property?: string
  }
  | {
    relation: RelationID
  }
  | {
    view: ViewID
  }
export const locate = new RequestType<LocateParams, Location | null, void>('likec4/locate')
export type LocateRequest = typeof locate
// #endregion

export namespace ChangeView {
  export interface ChangeColor {
    op: 'change-color'
    color: ThemeColor
    targets: NonEmptyArray<Fqn>
  }

  export interface ChangeShape {
    op: 'change-shape'
    shape: ElementShape
    targets: NonEmptyArray<Fqn>
  }

  export interface ChangeAutoLayout {
    op: 'change-autolayout'
    layout: AutoLayoutDirection
  }
}

export type ChangeView =
  | ChangeView.ChangeColor
  | ChangeView.ChangeShape
  | ChangeView.ChangeAutoLayout

export interface ChangeViewRequestParams {
  viewId: ViewID
  changes: NonEmptyArray<ChangeView>
}
export const changeView = new RequestType<ChangeViewRequestParams, Location | null, void>('likec4/change-view')
export type ChangeViewRequest = typeof changeView
