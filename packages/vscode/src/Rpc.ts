import type { ViewId as ViewID } from '@likec4/core'
import type {
  BuildDocumentsRequest,
  ChangeViewRequest,
  ChangeViewRequestParams,
  ComputeViewRequest,
  FetchComputedModelRequest,
  LayoutViewRequest,
  LocateParams,
  LocateRequest,
  ValidateLayoutRequest,
} from '@likec4/language-server/protocol'
import vscode from 'vscode'
import { NotificationType, RequestType } from 'vscode-jsonrpc'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import type { DocumentUri, Location } from 'vscode-languageserver-types'
import { logger } from './logger'
import { AbstractDisposable } from './util'

// #region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
// #endregion

// #region To server
const computeView: ComputeViewRequest = new RequestType('likec4/computeView')
const fetchComputedModel: FetchComputedModelRequest = new RequestType('likec4/fetchComputedModel')
const buildDocuments: BuildDocumentsRequest = new RequestType('likec4/build')
const locate: LocateRequest = new RequestType('likec4/locate')
const changeView: ChangeViewRequest = new RequestType('likec4/change-view')
const layoutView: LayoutViewRequest = new RequestType('likec4/layout-view')
const validateLayout: ValidateLayoutRequest = new RequestType('likec4/validate-layout')

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

  async fetchComputedModel(cleanCaches?: true) {
    const { model } = await this.client.sendRequest(fetchComputedModel, { cleanCaches })
    return model
  }

  async computeView(viewId: ViewID) {
    const { view } = await this.client.sendRequest(computeView, { viewId })
    return view
  }

  async layoutView(viewId: ViewID) {
    return await this.client.sendRequest(layoutView, { viewId })
  }

  async validateLayout() {
    return await this.client.sendRequest(validateLayout, {})
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
