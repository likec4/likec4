import type { ComputedView, Fqn, LikeC4ComputedModel, LikeC4Model, RelationID, ViewID } from '@likec4/core'
import type { DocumentUri, Location } from 'vscode-languageclient/lib/common/api'
import { NotificationType, RequestType, RequestType0 } from 'vscode-languageclient/lib/common/api'

// #region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
// #endregion

// #region To server
const fetchModel = new RequestType0<{ model: LikeC4Model | null }, void>('likec4/fetchModel')
const fetchComputedModel = new RequestType0<{ model: LikeC4ComputedModel | null }, void>('likec4/fetchComputedModel')

const computeView = new RequestType<{ viewId: ViewID }, { view: ComputedView | null }, void>(
  'likec4/computeView'
)

interface BuildDocumentsParams {
  docs: DocumentUri[]
}
const buildDocuments = new RequestType<BuildDocumentsParams, void, void>('likec4/buildDocuments')

export type LocateParams =
  | {
    element: Fqn
    property?: string
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
const locate = new RequestType<LocateParams, Location | null, void>('likec4/locate')

export const Rpc = {
  onDidChangeModel,
  fetchComputedModel,
  fetchModel,
  computeView,
  buildDocuments,
  locate
} as const
