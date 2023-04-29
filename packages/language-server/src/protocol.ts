import type { Fqn, LikeC4Model, RelationID, ViewID } from '@likec4/core'
import type { DocumentUri, Location,  } from 'vscode-languageserver-protocol'
import { NotificationType, RequestType0, RequestType } from 'vscode-languageserver-protocol'

//#region From server
export const onDidChangeModel = new NotificationType<void>('likec4/onDidChangeModel')
//#endregion

//#region To server
export const fetchModel = new RequestType0<{ model: LikeC4Model | null }, void>('likec4/fetchModel')

export interface BuildDocumentsParams {
  docs: DocumentUri[]
}
export const buildDocuments = new RequestType<BuildDocumentsParams, void, void>('likec4/buildDocuments')

export interface LocateElementParams {
  element: Fqn
  property?: string
}
export const locateElement = new RequestType<
  LocateElementParams,
  Location | null,
  void
>('likec4/locateElement')

export const locateRelation = new RequestType<{ id: RelationID }, Location | null, void>(
  'likec4/locateRelation'
)
export const locateView = new RequestType<{ id: ViewID }, Location | null, void>(
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
