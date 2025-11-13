import useLanguageClient from '#useLanguageClient'
import {
  BuildDocuments,
  ChangeView,
  DidChangeSnapshotNotification,
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
  ValidateLayout,
} from '@likec4/language-server/protocol'
import { createSingletonComposable, useDisposable } from 'reactive-vscode'
import type vscode from 'vscode'
import type { DocumentUri, Location } from 'vscode-languageserver-types'
import { logger } from './logger'

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
    return await queue(() => client.sendRequest(FetchComputedModel.req, { projectId }))
  }

  async function fetchMetrics() {
    return await queue(() => client.sendRequest(FetchTelemetryMetrics.req))
  }

  async function fetchViewsFromAllProjects() {
    const { views } = await client.sendRequest(FetchViewsFromAllProjects.req)
    return views ?? []
  }

  function onDidChangeModel(cb: () => void) {
    useDisposable(client.onNotification(DidChangeSnapshotNotification.type, cb))
  }

  function onRequestOpenView(cb: (params: DidRequestOpenViewNotification.Params) => void) {
    useDisposable(client.onNotification(DidRequestOpenViewNotification.type, cb))
  }

  async function layoutView(params: LayoutView.Params) {
    const { result } = await queue(() => client.sendRequest(LayoutView.req, params))
    return result
  }

  async function validateLayout() {
    return await client.sendRequest(ValidateLayout.req, {})
  }

  async function buildDocuments(docs: DocumentUri[]) {
    await client.sendRequest(BuildDocuments.req, { docs })
  }

  async function locate(params: Locate.Params): Promise<Location | null> {
    return await client.sendRequest(Locate.req, params)
  }

  async function changeView(req: ChangeView.Params) {
    return await queue(() => client.sendRequest(ChangeView.req, req))
  }

  async function getDocumentTags(params: GetDocumentTags.Params) {
    const { tags } = await client.sendRequest(GetDocumentTags.req, params)
    return tags
  }

  async function reloadProjects() {
    await queue(() => client.sendRequest(ReloadProjects.req))
  }

  async function registerProject(params: RegisterProject.Params) {
    const { id } = await queue(() => client.sendRequest(RegisterProject.req, params))
    return id
  }

  async function fetchProjects() {
    const { projects } = await queue(() => client.sendRequest(FetchProjects.req))
    return projects
  }

  async function notifyDidChangeSnapshot(snapshot: vscode.Uri) {
    await client.sendNotification(DidChangeSnapshotNotification.type, {
      snapshotUri: client.code2ProtocolConverter.asUri(snapshot),
    })
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
    notifyDidChangeSnapshot,
  }
})

export type Rpc = ReturnType<typeof useRpc>
