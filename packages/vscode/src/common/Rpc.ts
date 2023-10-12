import type { ComputedView, Fqn, LikeC4RawModel, RelationID, ViewID } from '@likec4/core'
import type * as vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import type { DocumentUri, Location } from 'vscode-languageserver-protocol'
import { NotificationType, RequestType, RequestType0 } from 'vscode-languageserver-protocol'
import { AbstractDisposable, disposeAll } from '../util'
import { Logger } from '../logger'

//#region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
//#endregion

//#region To server
const fetchRawModel = new RequestType0<{ rawmodel: LikeC4RawModel | null }, void>('likec4/fetchRaw')
const computeView = new RequestType<{ viewId: ViewID }, { view: ComputedView | null }, void>(
  'likec4/computeView'
)

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

export class Rpc extends AbstractDisposable {
  constructor(public readonly client: LanguageClient) {
    super()
  }

  override dispose() {
    super.dispose()
    Logger.info(`[Extension.Rpc] disposed`)
  }

  onDidChangeModel(cb: () => void): vscode.Disposable {
    const disposable = this.client.onNotification(onDidChangeModel, cb)
    this.onDispose(() => disposable.dispose())
    return disposable
  }

  async fetchModel() {
    const { rawmodel } = await this.client.sendRequest(fetchRawModel)
    return rawmodel
  }

  async computeView(viewId: ViewID) {
    const { view } = await this.client.sendRequest(computeView, { viewId })
    return view
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
