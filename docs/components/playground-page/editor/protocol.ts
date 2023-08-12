import type { Fqn, LikeC4Model, RelationID, ViewID } from '@likec4/core'
import type { DocumentUri, Location, } from 'vscode-languageclient/lib/common/api'
import { NotificationType, RequestType0, RequestType } from 'vscode-languageclient/lib/common/api'

//#region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
//#endregion

//#region To server
const fetchModel = new RequestType0<{ model: LikeC4Model | null }, void>('likec4/fetchModel')

interface BuildDocumentsParams {
  docs: DocumentUri[]
}
const buildDocuments = new RequestType<BuildDocumentsParams, void, void>('likec4/buildDocuments')

interface LocateElementParams {
  element: Fqn
  property?: string
}
const locateElement = new RequestType<
  LocateElementParams,
  Location | null,
  void
>('likec4/locateElement')

const locateRelation = new RequestType<{ id: RelationID }, Location | null, void>(
  'likec4/locateRelation'
)
const locateView = new RequestType<{ id: ViewID }, Location | null, void>(
  'likec4/locateView'
)
//#endregion

export const Rpc = {
  onDidChangeModel,
  fetchModel,
  buildDocuments,
  locateElement,
  locateRelation,
  locateView
} as const
