import type { Fqn, LikeC4Model, RelationID, ViewID } from '@likec4/core'
import type { DocumentUri, Location } from 'vscode-languageclient/lib/common/api'
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
  fetchModel,
  buildDocuments,
  locate
} as const
