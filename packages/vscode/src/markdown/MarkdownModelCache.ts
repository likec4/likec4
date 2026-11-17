import type { ProjectId } from '@likec4/core/types'
import { loggable } from '@likec4/log'
import { defineService, useDisposable, watch } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import { useIsActivated } from '../useIsActivated.ts'
import { useRpc } from '../useRpc.ts'
import { jsonForScript } from './html.ts'
import { projectKey } from './markdownItPlugin.ts'
import { RefreshScheduler } from './refresh.ts'
import {
  type ProjectResolution,
  type ResolvedProject,
  type UriLocation,
  documentUriOf,
  fromRpcProjects,
  resolveProject,
} from './resolveProject.ts'
import { sha1Hex, stableHash } from './sha1.ts'
import type { ProjectSnapshot } from './types.ts'

const textEncoder = new TextEncoder()

function hasMarkdownPreviewTab(): boolean {
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const input = tab.input
      if (
        input
        && typeof input === 'object'
        && 'viewType' in input
        && typeof input.viewType === 'string'
        && /markdown\.preview/i.test(input.viewType)
      ) {
        return true
      }
    }
  }
  return false
}

export const useMarkdownModelCache = defineService(() => {
  const { logger } = useExtensionLogger('markdown')
  const rpc = useRpc()
  const isActivated = useIsActivated()

  let workspaceHasSources: boolean | null = null
  let projects: ResolvedProject[] | null = null
  let projectsFetchInFlight = false
  let projectsDirty = false
  let pendingProjectsReason = ''

  const snapshots = new Map<string, ProjectSnapshot>()
  const inflightModels = new Set<string>()
  const dirtyModels = new Set<string>()
  const docRefs = new Map<string, Set<string>>()
  const pendingDiscoveryDocs = new Set<string>()

  const scheduler = new RefreshScheduler({
    documentsReferencing(keys) {
      const result: string[] = []
      for (const [docUri, referenced] of docRefs) {
        if (keys.some((k) => referenced.has(k))) {
          result.push(docUri)
        }
      }
      return result
    },
    hasOpenPreview: hasMarkdownPreviewTab,
    isDocumentOpen(docUri) {
      return pendingDiscoveryDocs.has(docUri)
        || vscode.workspace.textDocuments.some((doc) => documentUriOf(doc.uri) === docUri)
    },
    refresh(reason) {
      logger.debug`refresh markdown preview (${reason})`
      void vscode.commands.executeCommand('markdown.preview.refresh')
    },
  })

  useDisposable({
    dispose() {
      scheduler.dispose()
      snapshots.clear()
      docRefs.clear()
      pendingDiscoveryDocs.clear()
    },
  })

  function hasReferencingDocument(key: string): boolean {
    for (const referenced of docRefs.values()) {
      if (referenced.has(key)) {
        return true
      }
    }
    return false
  }

  async function fetchProjectModel(projectId: ProjectId, reason: string): Promise<void> {
    if (!isActivated.value) {
      return
    }
    const key = projectId
    if (inflightModels.has(key)) {
      dirtyModels.add(key)
      return
    }
    inflightModels.add(key)
    try {
      let next: ProjectSnapshot
      try {
        const { model } = await rpc.fetchLayoutedModel(projectId)
        if (!model) {
          const message = `Failed to load layouted model for project "${projectId}".`
          next = {
            hash: sha1Hex(`empty:${projectId}`),
            state: 'error',
            message,
            viewIds: new Set(),
          }
        } else {
          const modelJson = jsonForScript(model)
          const modelBytes = textEncoder.encode(modelJson).byteLength
          const hash = stableHash(model)
          next = {
            hash,
            state: 'ok',
            viewIds: new Set(Object.keys(model.views)),
            data: model,
            modelJson,
            modelBytes,
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : loggable(err)
        logger.debug`failed to fetch layouted model for ${projectId}: ${message}`
        next = {
          hash: sha1Hex(`error:${message}`),
          state: 'error',
          message,
          viewIds: new Set(),
        }
      }

      const prev = snapshots.get(key)
      if (!prev || prev.hash !== next.hash || prev.state !== next.state || prev.message !== next.message) {
        snapshots.set(key, next)
        scheduler.projectsChanged([key], reason)
      }
    } finally {
      inflightModels.delete(key)
      if (dirtyModels.delete(key)) {
        void fetchProjectModel(projectId, 'coalesced update')
      }
    }
  }

  async function refreshProjects(reason: string): Promise<void> {
    if (!isActivated.value) {
      return
    }
    if (projectsFetchInFlight) {
      projectsDirty = true
      pendingProjectsReason = reason
      return
    }
    projectsFetchInFlight = true
    try {
      const raw = await rpc.fetchProjects()
      const next = fromRpcProjects(raw)
      const prevIds = new Set((projects ?? []).map((p) => projectKey(p)))
      const nextIds = new Set(next.map((p) => projectKey(p)))
      projects = next

      const removed: string[] = []
      for (const oldKey of prevIds) {
        if (!nextIds.has(oldKey)) {
          snapshots.delete(oldKey)
          removed.push(oldKey)
        }
      }

      const hadPendingDocs = pendingDiscoveryDocs.size > 0
      pendingDiscoveryDocs.clear()

      if (removed.length > 0) {
        scheduler.projectsChanged(removed, reason)
      }
      if (hadPendingDocs || (prevIds.size !== nextIds.size && docRefs.size > 0)) {
        scheduler.refreshAll(reason)
      }

      for (const project of next) {
        const key = projectKey(project)
        if (snapshots.has(key) || hasReferencingDocument(key)) {
          void fetchProjectModel(project.id, reason)
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch LikeC4 projects for markdown preview', { error: err })
    } finally {
      projectsFetchInFlight = false
      if (projectsDirty) {
        const nextReason = pendingProjectsReason || 'projects changed'
        projectsDirty = false
        pendingProjectsReason = ''
        void refreshProjects(nextReason)
      }
    }
  }

  watch(
    () => isActivated.value,
    (active) => {
      if (active) {
        workspaceHasSources = true
        void refreshProjects('language server ready')
      }
    },
    { immediate: true },
  )

  rpc.onDidChangeProjects(() => {
    void refreshProjects('projects changed')
  })

  rpc.onDidChangeModel(({ projectId }) => {
    if (!isActivated.value) {
      return
    }
    if (snapshots.has(projectId) || hasReferencingDocument(projectId)) {
      void fetchProjectModel(projectId, 'model changed')
    }
  })

  useDisposable(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      const key = documentUriOf(doc.uri)
      if (key) {
        docRefs.delete(key)
        pendingDiscoveryDocs.delete(key)
      }
    }),
  )

  function setWorkspaceHasSources(hasSources: boolean): void {
    const changed = workspaceHasSources !== hasSources
    workspaceHasSources = hasSources
    if (hasSources && changed && pendingDiscoveryDocs.size > 0) {
      pendingDiscoveryDocs.clear()
      scheduler.refreshAll('sources discovered')
    } else if (!hasSources && pendingDiscoveryDocs.size > 0) {
      pendingDiscoveryDocs.clear()
      scheduler.refreshAll('no workspace sources')
    }
  }

  function resolve(docDir: UriLocation | undefined, explicit: string | undefined): ProjectResolution | 'pending' {
    if (projects === null) {
      if (workspaceHasSources === false && !isActivated.value) {
        return { ok: false, message: 'No LikeC4 project found in this workspace.' }
      }
      return 'pending'
    }
    return resolveProject(docDir, explicit, projects)
  }

  function getSnapshot(project: ResolvedProject): ProjectSnapshot | undefined {
    const key = projectKey(project)
    const cached = snapshots.get(key)
    if (!cached) {
      void fetchProjectModel(project.id, 'initial load')
    }
    return cached
  }

  function recordReferences(docKey: string, referenced: ReadonlyArray<ResolvedProject>): void {
    docRefs.set(docKey, new Set(referenced.map((p) => projectKey(p))))
    pendingDiscoveryDocs.delete(docKey)
  }

  function markPendingDiscovery(docKey: string): void {
    pendingDiscoveryDocs.add(docKey)
  }

  function refreshAllPreviews(reason: string): void {
    scheduler.refreshAll(reason)
  }

  return {
    setWorkspaceHasSources,
    resolve,
    getSnapshot,
    recordReferences,
    markPendingDiscovery,
    refreshAllPreviews,
  }
})
