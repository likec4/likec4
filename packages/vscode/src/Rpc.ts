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
import { nextTick, triggerRef, useDisposable } from 'reactive-vscode'
import { NotificationType, RequestType } from 'vscode-jsonrpc'
import type { BaseLanguageClient } from 'vscode-languageclient'
import type { DocumentUri, Location } from 'vscode-languageserver-types'
import { computedModel } from './state'

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

const lsp = {
  onDidChangeModel,
  computeView,
  fetchComputedModel,
  buildDocuments,
  locate,
  changeView,
  layoutView,
  validateLayout,
}

export function useRpc(client: BaseLanguageClient) {
  let previousOperation = Promise.resolve({} as any)

  async function queue<T>(op: () => Promise<T>): Promise<T> {
    const opPromise = previousOperation.then(op)
    // ignore failures
    previousOperation = opPromise.catch(() => ({} as any))
    return await opPromise
  }

  async function fetchComputedModel(cleanCaches?: true) {
    const result = await queue(() => client.sendRequest(lsp.fetchComputedModel, { cleanCaches }))
    if (result.model) {
      computedModel.value = result.model
      nextTick(() => triggerRef(computedModel))
    }
    return result
  }

  function onDidChangeModel(cb: () => void) {
    useDisposable(client.onNotification(lsp.onDidChangeModel, cb))
  }

  async function layoutView(viewId: ViewID) {
    const { result } = await queue(() => client.sendRequest(lsp.layoutView, { viewId }))
    return result
  }

  async function validateLayout() {
    return await client.sendRequest(lsp.validateLayout, {})
  }

  async function buildDocuments(docs: DocumentUri[]) {
    await client.sendRequest(lsp.buildDocuments, { docs })
  }

  async function locate(params: LocateParams): Promise<Location | null> {
    return await client.sendRequest(lsp.locate, params)
  }

  async function changeView(req: ChangeViewRequestParams) {
    return await client.sendRequest(lsp.changeView, req)
  }

  return {
    client,
    onDidChangeModel,
    fetchComputedModel,
    // computeView,
    layoutView,
    validateLayout,
    buildDocuments,
    locate,
    changeView,
  }
}

export type Rpc = ReturnType<typeof useRpc>
