import type { ComputedView, Fqn, LikeC4Model, LikeC4RawModel, RelationID, ViewID } from '@likec4/core'
import type { DocumentUri, Location } from 'vscode-languageserver-protocol'
import { NotificationType, RequestType, RequestType0 } from 'vscode-languageserver-protocol'

//#region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
//#endregion

//#region To server
const fetchRawModel = new RequestType0<{ rawmodel: LikeC4RawModel | null }, void>('likec4/fetchRaw')
const fetchModel = new RequestType0<{ model: LikeC4Model | null }, void>('likec4/fetchModel')

const computeView = new RequestType<{ viewId: ViewID }, { view: ComputedView | null }, void>('likec4/computeView')

const rebuild = new RequestType0<{ docs: DocumentUri[] }, void>('likec4/rebuildModel')

interface BuildDocumentsParams {
  docs: DocumentUri[]
}
const buildDocuments = new RequestType<BuildDocumentsParams, void, void>('likec4/buildDocuments')

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
//#endregion

export const Rpc = {
  onDidChangeModel,
  fetchModel,
  fetchRawModel,
  computeView,
  rebuild,
  buildDocuments,
  locate
} as const
