import type { ViewID } from '@likec4/core'
import type {
  BuildDocumentsRequest,
  ChangeViewRequest,
  ChangeViewRequestParams,
  ComputeViewRequest,
  FetchModelRequest,
  LocateParams,
  LocateRequest
} from '@likec4/language-server/protocol'
import type * as vscode from 'vscode'
import { NotificationType, RequestType, RequestType0 } from 'vscode-jsonrpc'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import type { DocumentUri, Location } from 'vscode-languageserver-types'
import { logger } from '../logger'
import { AbstractDisposable } from '../util'

// #region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
// #endregion

// #region To server
const fetchModel: FetchModelRequest = new RequestType0('likec4/fetchModel')
const computeView: ComputeViewRequest = new RequestType('likec4/computeView')
const buildDocuments: BuildDocumentsRequest = new RequestType('likec4/build')
const locate: LocateRequest = new RequestType('likec4/locate')
const changeView: ChangeViewRequest = new RequestType('likec4/change-view')

// #endregion

export class Rpc extends AbstractDisposable {
  constructor(public readonly client: LanguageClient) {
    super()
  }

  override dispose() {
    super.dispose()
    logger.info(`[Rpc] disposed`)
  }

  onDidChangeModel(cb: () => void): vscode.Disposable {
    const disposable = this.client.onNotification(onDidChangeModel, cb)
    this.onDispose(() => disposable.dispose())
    return disposable
  }

  async fetchModel() {
    const { model } = await this.client.sendRequest(fetchModel)
    return model
  }

  async computeView(viewId: ViewID) {
    const { view } = await this.client.sendRequest(computeView, { viewId })
    return view
  }

  async buildDocuments(docs: DocumentUri[]) {
    await this.client.sendRequest(buildDocuments, { docs })
  }

  async locate(params: LocateParams): Promise<Location | null> {
    return await this.client.sendRequest(locate, params)
  }

  async changeView(req: ChangeViewRequestParams) {
    return await this.client.sendRequest(changeView, req)
  }
}
