import {
  BuildDocuments,
  ChangeView,
  DidChangeModelNotification,
  DidChangeProjectsNotification,
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
import { defineService, useDisposable } from 'reactive-vscode'
import type { Location } from 'vscode'
import type { DocumentUri } from 'vscode-languageserver-types'
import { useExtensionLogger } from './useExtensionLogger'
import { whenExtensionActive } from './useIsActivated'
import { useLanguageClient } from './useLanguageClient'

async function maxWait(ms: number, promise: Promise<any>) {
  let t: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race<void>([
      promise,
      new Promise<void>((resolve) => {
        t = setTimeout(() => resolve(), ms)
      }),
    ])
  } catch {
    // Ignore any errors from race condition
    return undefined
  } finally {
    clearTimeout(t)
  }
}

export const useRpc = defineService(() => {
  const { client } = useLanguageClient()
  const { logger } = useExtensionLogger('rpc')

  let onActivation: (() => void) | undefined

  let queueOp = new Promise<void>((resolve) => {
    onActivation = () => {
      onActivation = undefined
      logger.debug('trigger deferred queue')
      resolve()
    }
  })

  // Trigger deferred queue when extension is activated
  whenExtensionActive(() => {
    setTimeout(() => {
      onActivation?.()
    }, 200)
  })

  function queue<T>(op: () => Promise<T>): Promise<T> {
    const opPromise = queueOp.then(() => op())
    // ignore failures, and limit waiting time (i.e. previous operation hangs)
    queueOp = queueOp
      .then(() =>
        maxWait(
          1_000,
          opPromise,
        )
      )
    return opPromise
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
      const { views } = await queue(() => client.sendRequest(FetchViewsFromAllProjects.req))
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
      return await queue(() => client.sendRequest(ValidateLayout.req, {}))
    },

    async buildDocuments(docs: DocumentUri[]) {
      await queue(() => client.sendRequest(BuildDocuments.req, { docs }))
    },

    async locate(params: Locate.Params): Promise<Location | null> {
      const loc = await queue(() => client.sendRequest(Locate.req, params))
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
      const { tags } = await queue(() => client.sendRequest(GetDocumentTags.req, params))
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
  }
})

export type Rpc = ReturnType<typeof useRpc>
