import {
  BuildDocuments,
  ChangeView,
  DidChangeModelNotification,
  DidChangeProjectsNotification,
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
import type { DocumentUri } from 'vscode-languageserver-types'
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

    onDidChangeModel(cb: (params: DidChangeModelNotification.Params) => void) {
      return useDisposable(client.onNotification(DidChangeModelNotification.type, cb))
    },

    onDidChangeProjects(cb: () => void) {
      return useDisposable(client.onNotification(DidChangeProjectsNotification.type, cb))
    },

    onRequestOpenView(cb: (params: DidRequestOpenViewNotification.Params) => void) {
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

    async locate(params: Locate.Params): Promise<vscode.Location | null> {
      const loc = await client.sendRequest(Locate.req, params)
      if (!loc) {
        return null
      }
      return client.protocol2CodeConverter.asLocation(loc)
    },

    async changeView(req: ChangeView.Params) {
      const res = await queue(() => client.sendRequest(ChangeView.req, req))
      if (!res.success) {
        return {
          success: false as const,
          error: res.error,
        }
      }
      return {
        location: res.location ? client.protocol2CodeConverter.asLocation(res.location) : null,
        success: res.success,
      }
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

    async notifyDidChangeSnapshot(event: 'update' | 'delete', snapshot: vscode.Uri) {
      await client.sendNotification(
        DidChangeSnapshotNotification.type,
        {
          [`${event}` as const]: client.code2ProtocolConverter.asUri(snapshot),
        } as DidChangeSnapshotNotification.Params,
      )
    },
  }
})

export type Rpc = ReturnType<typeof useRpc>
