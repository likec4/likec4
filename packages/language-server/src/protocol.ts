import type {
  AutoLayoutDirection,
  ComputedView,
  ElementShape,
  Fqn,
  LikeC4Model,
  LikeC4RawModel,
  NonEmptyArray,
  RelationID,
  ThemeColor,
  ViewID
} from '@likec4/core'
import type { DocumentUri, Location } from 'vscode-languageserver-protocol'
import { NotificationType, RequestType, RequestType0 } from 'vscode-languageserver-protocol'

// #region From server
export const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
// #endregion

// #region To server
export const fetchRawModel = new RequestType0<{ rawmodel: LikeC4RawModel | null }, void>(
  'likec4/fetchRaw'
)
export const fetchModel = new RequestType0<{ model: LikeC4Model | null }, void>('likec4/fetchModel')

export const computeView = new RequestType<{ viewId: ViewID }, { view: ComputedView | null }, void>(
  'likec4/computeView'
)

export interface BuildDocumentsParams {
  docs: DocumentUri[]
}
export const buildDocuments = new RequestType<BuildDocumentsParams, void, void>('likec4/build')

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
// #endregion

export namespace Changes {
  export interface ChangeColor {
    viewId: ViewID
    op: 'change-color'
    color: ThemeColor
    targets: NonEmptyArray<Fqn>
  }

  export interface ChangeShape {
    viewId: ViewID
    op: 'change-shape'
    shape: ElementShape
    targets: NonEmptyArray<Fqn>
  }

  export interface ChangeAutoLayout {
    viewId: ViewID
    op: 'change-autolayout'
    layout: AutoLayoutDirection
  }
}

export type ChangeCommand =
  | Changes.ChangeColor
  | Changes.ChangeShape
  | Changes.ChangeAutoLayout

export interface ChangeOpParams {
  change: ChangeCommand
}
export const changeOp = new RequestType<ChangeOpParams, Location | null, void>('likec4/change')
