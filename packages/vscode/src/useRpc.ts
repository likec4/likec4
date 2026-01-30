import {
  BuildDocuments,
  ChangeView,
  DidChangeModelNotification,
  DidChangeSnapshotNotification,
  DidRequestOpenViewNotification,
  FetchComputedModel,
  FetchProjects,
  FetchProjectsOverview,
  FetchTelemetryMetrics,
  FetchViewsFromAllProjects,
  GetDocumentTags,
  LayoutView,
  Locate,
  RegisterProject,
  ReloadProjects,
  ValidateLayout,
} from '@likec4/language-server/protocol'
import { loggable } from '@likec4/log'
import { createSingletonComposable, useDisposable } from 'reactive-vscode'
import type vscode from 'vscode'
import type { DocumentUri, Location } from 'vscode-languageserver-types'
import { useExtensionLogger } from './useExtensionLogger'
import { useLanguageClient } from './useLanguageClient'

export const useRpc = createSingletonComposable(() => {
  const { client } = useLanguageClient()
  const { logger } = useExtensionLogger('rpc')
  let previousOperation = Promise.resolve(null as any)

  async function queue<T>(op: () => Promise<T>): Promise<T> {
    const opPromise = previousOperation.then(op)
    // ignore failures
    previousOperation = opPromise.catch((err) => {
      logger.debug(loggable(err))
      return {} as any
    })
    return await opPromise
  }

  return {
    client,

    async fetchComputedModel(projectId: string) {
      return await queue(() => client.sendRequest(FetchComputedModel.req, { projectId }))
    },

    async fetchMetrics() {
      return await queue(() => client.sendRequest(FetchTelemetryMetrics.req))
    },

    async fetchViewsFromAllProjects() {
      const { views } = await client.sendRequest(FetchViewsFromAllProjects.req)
      return views ?? []
    },

    async onDidChangeModel(cb: () => void) {
      return useDisposable(client.onNotification(DidChangeModelNotification.type, cb))
    },

    async onRequestOpenView(cb: (params: DidRequestOpenViewNotification.Params) => void) {
      return useDisposable(client.onNotification(DidRequestOpenViewNotification.type, cb))
    },

    async layoutView(params: LayoutView.Params) {
      const { result } = await queue(() => client.sendRequest(LayoutView.req, params))
      return result
    },

    async validateLayout() {
      return await client.sendRequest(ValidateLayout.req, {})
    },

    async buildDocuments(docs: DocumentUri[]) {
      await client.sendRequest(BuildDocuments.req, { docs })
    },

    async locate(params: Locate.Params): Promise<Location | null> {
      return await client.sendRequest(Locate.req, params)
    },

    async changeView(req: ChangeView.Params) {
      return await queue(() => client.sendRequest(ChangeView.req, req))
    },

    async getDocumentTags(params: GetDocumentTags.Params) {
      const { tags } = await client.sendRequest(GetDocumentTags.req, params)
      return tags
    },

    async reloadProjects() {
      await queue(() => client.sendRequest(ReloadProjects.req))
    },

    async registerProject(params: RegisterProject.Params) {
      const { id } = await queue(() => client.sendRequest(RegisterProject.req, params))
      return id
    },

    async fetchProjects() {
      const { projects } = await queue(() => client.sendRequest(FetchProjects.req))
      return projects
    },

    async fetchProjectsOverview() {
      return await queue(() => client.sendRequest(FetchProjectsOverview.req))
    },

    async notifyDidChangeSnapshot(snapshot: vscode.Uri) {
      await client.sendNotification(DidChangeSnapshotNotification.type, {
        snapshotUri: client.code2ProtocolConverter.asUri(snapshot),
      })
    },
  }
})

export type Rpc = ReturnType<typeof useRpc>
