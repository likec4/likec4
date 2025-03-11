import {
  type BuildDocuments,
  type ChangeView,
  type FetchViewsFromAllProjects,
  type LayoutView,
  type Locate,
  type ValidateLayout,
  FetchComputedModel,
  FetchTelemetryMetrics,
} from '@likec4/language-server/protocol'
import { nextTick, triggerRef, useDisposable } from 'reactive-vscode'
import { NotificationType, RequestType, RequestType0 } from 'vscode-jsonrpc'
import type { BaseLanguageClient } from 'vscode-languageclient'
import type { DocumentUri, Location } from 'vscode-languageserver-types'
import { computedModels } from './state'

// #region From server
const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
// #endregion

// #region To server
// const computeView: ComputeView.Req = new RequestType<C('likec4/computeView')
const fetchViewsFromAllProjects: FetchViewsFromAllProjects.Req = new RequestType0('likec4/fetchViewsFromAllProjects')
const fetchComputedModel: FetchComputedModel.Req = new RequestType('likec4/fetchComputedModel')
const buildDocuments: BuildDocuments.Req = new RequestType('likec4/build')
const locate: Locate.Req = new RequestType('likec4/locate')
const changeView: ChangeView.Req = new RequestType('likec4/change-view')
const layoutView: LayoutView.Req = new RequestType('likec4/layout-view')
const validateLayout: ValidateLayout.Req = new RequestType('likec4/validate-layout') as any

// #endregion

const lsp = {
  onDidChangeModel,
  fetchViewsFromAllProjects,
  // computeView,
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

  async function fetchComputedModel(projectId: string) {
    const result = await queue(() => client.sendRequest(FetchComputedModel.req, { projectId }))
    if (result.model) {
      computedModels.value[projectId] = result.model
      nextTick(() => {
        triggerRef(computedModels)
      })
    }
    return result
  }

  async function fetchMetrics() {
    return await queue(() => client.sendRequest(FetchTelemetryMetrics.req))
  }

  async function fetchViewsFromAllProjects() {
    const { views } = await client.sendRequest(lsp.fetchViewsFromAllProjects)
    return views ?? []
  }

  function onDidChangeModel(cb: () => void) {
    useDisposable(client.onNotification(lsp.onDidChangeModel, cb))
  }

  async function layoutView(params: LayoutView.Params) {
    const { result } = await queue(() => client.sendRequest(lsp.layoutView, params))
    return result
  }

  async function validateLayout() {
    return await client.sendRequest(lsp.validateLayout, {})
  }

  async function buildDocuments(docs: DocumentUri[]) {
    await client.sendRequest(lsp.buildDocuments, { docs })
  }

  async function locate(params: Locate.Params): Promise<Location | null> {
    return await client.sendRequest(lsp.locate, params)
  }

  async function changeView(req: ChangeView.Params) {
    return await client.sendRequest(lsp.changeView, req)
  }

  return {
    client,
    onDidChangeModel,
    fetchComputedModel,
    fetchMetrics,
    layoutView,
    validateLayout,
    buildDocuments,
    locate,
    changeView,
    fetchViewsFromAllProjects,
  }
}

export type Rpc = ReturnType<typeof useRpc>
