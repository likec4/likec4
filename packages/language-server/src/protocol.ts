import type { LikeC4Model } from '@likec4/core/types';
import type { DocumentUri } from 'vscode-languageserver-protocol';
import { NotificationType, RequestType0, RequestType } from 'vscode-languageserver-protocol'

//#region From server
export const onDidChangeLikeC4Model = new NotificationType('likec4/onDidChangeModel')
//#endregion


// //#region To server
export const fetchLikeC4Model = new RequestType0<{model: LikeC4Model | null}, unknown>('likec4/fetchModel')
export const buildDocuments = new RequestType<DocumentUri[], void, unknown>('likec4/buildDocuments')

// export const locateElement = new RequestType<{element: Fqn, property?: string}, Location | null, unknown>('c4x/locateElement')

// export const locateRelation = new RequestType<{id: RelationID}, Location | null, unknown>('c4x/locateRelation')
// export const locateView = new RequestType<{id: ViewID}, Location | null, unknown>('c4x/locateView')
// //#endregion

export const Rpc = {
  onDidChangeModel: onDidChangeLikeC4Model,
  fetchModel: fetchLikeC4Model,
  buildDocuments
} as const
