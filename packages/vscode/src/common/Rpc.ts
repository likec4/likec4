import type { Fqn, LikeC4Model, RelationID, ViewID } from '@likec4/core'
import type * as vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import type { DocumentUri, Location } from 'vscode-languageserver-protocol'
import { NotificationType, RequestType, RequestType0 } from 'vscode-languageserver-protocol'
import { disposeAll } from '../util'
import { Logger } from '../logger'

//#region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
//#endregion

//#region To server
const fetchModel = new RequestType0<{ model: LikeC4Model | null }, void>('likec4/fetchModel')

const rebuild = new RequestType0<{ docs: DocumentUri[] }, void>('likec4/rebuildModel')

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

// // //#endregion

export class Rpc implements vscode.Disposable {
  private _disposables: vscode.Disposable[] = []

  constructor(public readonly client: LanguageClient) {}

  dispose() {
    Logger.info(`[Extension.Rpc] dispose`)
    disposeAll(this._disposables)
  }

  onDidChangeModel(cb: () => void): vscode.Disposable {
    const disposable = this.client.onNotification(onDidChangeModel, cb)
    this._disposables.push(disposable)
    return disposable
  }

  async fetchModel() {
    const { model } = await this.client.sendRequest(fetchModel)
    return model
  }

  async rebuild(): Promise<DocumentUri[]> {
    const { docs } = await this.client.sendRequest(rebuild)
    Logger.debug(`[Rpc] rebuild response: ${docs}`)
    return docs
  }

  async buildDocuments(docs: DocumentUri[]) {
    return await this.client.sendRequest(buildDocuments, { docs })
  }

  async locate<P extends LocateParams>(params: P): Promise<Location | null> {
    return await this.client.sendRequest(locate, params)
  }
}
