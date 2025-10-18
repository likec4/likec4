import useLanguageClient from '#useLanguageClient'
import type {
  BuildDocuments,
  ChangeView,
  DidRequestOpenViewNotification,
  FetchComputedModel,
  FetchProjects,
  FetchTelemetryMetrics,
  FetchViewsFromAllProjects,
  GetDocumentTags,
  LayoutView,
  Locate,
  RegisterProject,
  ReloadProjects,
  // type SaveManualLayout,
  ValidateLayout,
} from '@likec4/language-server/protocol'
import { createSingletonComposable, useDisposable } from 'reactive-vscode'
import { NotificationType, RequestType, RequestType0 } from 'vscode-jsonrpc'
import type { DocumentUri, Location } from 'vscode-languageserver-types'
import { logger } from './logger'

// #region From server
const onDidChangeModelNotification = new NotificationType<string>('likec4/onDidChangeModel')
const onRequestOpenViewNotification = new NotificationType<DidRequestOpenViewNotification.Params>(
  'likec4/onRequestOpenView',
)
// #endregion

// #region To server
// const computeView: ComputeView.Req = new RequestType<C('likec4/computeView')
const fetchViewsFromAllProjectsReq: FetchViewsFromAllProjects.Req = new RequestType0('likec4/fetchViewsFromAllProjects')
const fetchComputedModelReq: FetchComputedModel.Req = new RequestType('likec4/fetchComputedModel')
const fetchMetricsReq: FetchTelemetryMetrics.Req = new RequestType0('likec4/metrics')
const fetchProjectsReq: FetchProjects.Req = new RequestType0('likec4/fetch-projects')
const buildDocumentsReq: BuildDocuments.Req = new RequestType('likec4/build')
const reloadProjectsReq: ReloadProjects.Req = new RequestType0('likec4/reload-projects')
const registerProjectReq: RegisterProject.Req = new RequestType('likec4/register-project')
const locateReq: Locate.Req = new RequestType('likec4/locate')
const changeViewReq: ChangeView.Req = new RequestType('likec4/change-view')
const layoutViewReq: LayoutView.Req = new RequestType('likec4/layout-view')
const validateLayoutReq: ValidateLayout.Req = new RequestType('likec4/validate-layout') as any
const getDocumentTagsReq: GetDocumentTags.Req = new RequestType('likec4/document-tags')
// const saveManualLayout: SaveManualLayout.Req = new RequestType('likec4/save-manual-layout')

// #endregion

export const useRpc = createSingletonComposable(() => {
  logger.debug('Initializing RPC client')

  const client = useLanguageClient()
  let previousOperation = Promise.resolve({} as any)

  async function queue<T>(op: () => Promise<T>): Promise<T> {
    const opPromise = previousOperation.then(op)
    // ignore failures
    previousOperation = opPromise.catch(() => ({} as any))
    return await opPromise
  }

  async function fetchComputedModel(projectId: string) {
    return await queue(() => client.sendRequest(fetchComputedModelReq, { projectId }))
  }

  async function fetchMetrics() {
    return await queue(() => client.sendRequest(fetchMetricsReq))
  }

  async function fetchViewsFromAllProjects() {
    const { views } = await client.sendRequest(fetchViewsFromAllProjectsReq)
    return views ?? []
  }

  function onDidChangeModel(cb: () => void) {
    useDisposable(client.onNotification(onDidChangeModelNotification, cb))
  }

  function onRequestOpenView(cb: (params: DidRequestOpenViewNotification.Params) => void) {
    useDisposable(client.onNotification(onRequestOpenViewNotification, cb))
  }

  async function layoutView(params: LayoutView.Params) {
    const { result } = await queue(() => client.sendRequest(layoutViewReq, params))
    return result
  }

  async function validateLayout() {
    return await client.sendRequest(validateLayoutReq, {})
  }

  async function buildDocuments(docs: DocumentUri[]) {
    await client.sendRequest(buildDocumentsReq, { docs })
  }

  async function locate(params: Locate.Params): Promise<Location | null> {
    return await client.sendRequest(locateReq, params)
  }

  async function changeView(req: ChangeView.Params) {
    return await client.sendRequest(changeViewReq, req)
  }

  async function getDocumentTags(params: GetDocumentTags.Params) {
    const { tags } = await client.sendRequest(getDocumentTagsReq, params)
    return tags
  }

  async function reloadProjects() {
    await client.sendRequest(reloadProjectsReq)
  }

  async function registerProject(params: RegisterProject.Params) {
    const { id } = await client.sendRequest(registerProjectReq, params)
    return id
  }

  async function fetchProjects() {
    const { projects } = await client.sendRequest(fetchProjectsReq)
    return projects
  }

  return {
    client,
    onDidChangeModel,
    onRequestOpenView,
    fetchComputedModel,
    fetchMetrics,
    fetchProjects,
    layoutView,
    validateLayout,
    buildDocuments,
    locate,
    changeView,
    fetchViewsFromAllProjects,
    getDocumentTags,
    reloadProjects,
    registerProject,
  }
})

export type Rpc = ReturnType<typeof useRpc>
