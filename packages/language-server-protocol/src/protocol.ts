// import type { likec4 } from '@likec4/core';
// import type { DocumentUri, Location } from 'vscode-languageserver-protocol';
// import { NotificationType, RequestType, RequestType0 } from 'vscode-languageserver-protocol'
import { NotificationType } from 'vscode-languageserver-protocol'

//#region From server
export const onDidChangeC4XModel = new NotificationType('likec4/onDidChangeModel')
//#endregion


// //#region To server
// export const fetchC4XModel = new RequestType0<{state: Model | null}, unknown>('c4x/fetchC4XModel')
// export const rebuildDocuments = new RequestType<DocumentUri[], void, unknown>('c4x/rebuildDocuments')

// export const locateElement = new RequestType<{element: Fqn, property?: string}, Location | null, unknown>('c4x/locateElement')

// export const locateRelation = new RequestType<{id: RelationID}, Location | null, unknown>('c4x/locateRelation')
// export const locateView = new RequestType<{id: ViewID}, Location | null, unknown>('c4x/locateView')
// //#endregion
