import type { ProjectId } from '@likec4/core/types'
import { loggable } from '@likec4/log'
import { posix } from 'pathe'
import { defineService, useDisposable, watch } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import { useIsActivated } from '../useIsActivated.ts'
import { useRpc } from '../useRpc.ts'
import { isLikeC4Source } from '../utils.ts'
import { jsonForScript } from './html.ts'
import { projectKey } from './markdownItPlugin.ts'
import { RefreshScheduler } from './refresh.ts'
import {
  type ProjectResolution,
  type ResolvedProject,
  type UriLocation,
  documentDirOf,
  documentUriOf,
  fromRpcProjects,
  isWithinLocation,
  normalizeUri,
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
  const lastValid = new Map<string, { snap: ProjectSnapshot; prev?: ProjectSnapshot | undefined; okAt: number }>()
  const inflightModels = new Set<string>()
  const dirtyModels = new Set<string>()
  const diagTimers = new Map<string, ReturnType<typeof setTimeout>>()
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
      for (const timer of diagTimers.values()) {
        clearTimeout(timer)
      }
      diagTimers.clear()
      scheduler.dispose()
      snapshots.clear()
      lastValid.clear()
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

  function diagnosticOwnerProject(uri: vscode.Uri): ResolvedProject | undefined {
    if (!projects || projects.length === 0) {
      return undefined
    }
    const targetUri = documentUriOf(uri)
    if (targetUri) {
      const targetLoc = normalizeUri(targetUri)
      const direct = projects.find((p) =>
        p.docs.some((d) => {
          const docLoc = normalizeUri(d)
          return docLoc.scheme === targetLoc.scheme
            && docLoc.authority === targetLoc.authority
            && docLoc.path === targetLoc.path
        })
      )
      if (direct) {
        return direct
      }
    }
    const dir = documentDirOf(uri)
    if (!dir) {
      return undefined
    }
    const resolved = resolveProject(dir, undefined, projects)
    if (!resolved.ok) {
      return undefined
    }
    const project = resolved.project
    return isWithinLocation(dir, {
        scheme: project.scheme,
        authority: project.authority,
        path: project.folderPath,
      })
      ? project
      : undefined
  }

  function projectDiagnosticError(projectId: ProjectId): string | undefined {
    const errors: Array<{ file: string; line: number; message: string }> = []
    for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
      const errDiags = diagnostics.filter(
        (d) => d.severity === vscode.DiagnosticSeverity.Error && (d.source === 'likec4' || isLikeC4Source(uri.path)),
      )
      if (errDiags.length === 0) {
        continue
      }
      const owner = diagnosticOwnerProject(uri)
      if (!owner || owner.id !== projectId) {
        continue
      }
      const file = posix.basename(uri.path) || uri.fsPath
      for (const d of errDiags) {
        errors.push({ file, line: d.range.start.line + 1, message: d.message })
      }
    }
    if (errors.length === 0) {
      return undefined
    }
    const first = errors[0]!
    const extra = errors.length > 1 ? ` (+${errors.length - 1} more)` : ''
    return `${first.file}:${first.line}: ${first.message}${extra}`
  }

  function buildStaleOrErrorSnapshot(projectId: ProjectId, message: string, fromDiagnostics: boolean): ProjectSnapshot {
    const valid = lastValid.get(projectId)
    const fallback = valid && fromDiagnostics && Date.now() - valid.okAt < 600 && valid.prev
      ? valid.prev
      : valid?.snap
    if (fallback?.data) {
      return {
        ...fallback,
        state: 'stale',
        message,
      }
    }
    return {
      hash: sha1Hex(`error:${message}`),
      state: 'error',
      message,
      viewIds: new Set(),
    }
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
      const diagError = projectDiagnosticError(projectId)
      const fromDiagnostics = reason === 'diagnostics changed'
      let next: ProjectSnapshot

      if (diagError && fromDiagnostics && lastValid.has(key)) {
        next = buildStaleOrErrorSnapshot(projectId, diagError, true)
      } else {
        try {
          const { model } = await rpc.fetchLayoutedModel(projectId)
          if (!model) {
            next = buildStaleOrErrorSnapshot(
              projectId,
              diagError ?? `Failed to load layouted model for project "${projectId}".`,
              false,
            )
          } else {
            const modelJson = jsonForScript(model)
            const modelBytes = textEncoder.encode(modelJson).byteLength
            const hash = stableHash(model)
            const viewIds = new Set(Object.keys(model.views))
            if (diagError) {
              const valid = lastValid.get(key)
              if (valid?.snap.data) {
                next = buildStaleOrErrorSnapshot(projectId, diagError, false)
              } else if (viewIds.size > 0) {
                next = {
                  hash,
                  state: 'stale',
                  message: diagError,
                  viewIds,
                  data: model,
                  modelJson,
                  modelBytes,
                }
              } else {
                next = {
                  hash: sha1Hex(`error:${diagError}`),
                  state: 'error',
                  message: diagError,
                  viewIds: new Set(),
                }
              }
            } else {
              next = {
                hash,
                state: 'ok',
                viewIds,
                data: model,
                modelJson,
                modelBytes,
              }
              const prevValid = lastValid.get(key)?.snap
              lastValid.set(key, {
                snap: next,
                prev: prevValid && prevValid.hash !== next.hash ? prevValid : lastValid.get(key)?.prev,
                okAt: Date.now(),
              })
            }
          }
        } catch (err) {
          const caught = err instanceof Error ? err.message : loggable(err)
          logger.debug`failed to fetch layouted model for ${projectId}: ${caught}`
          next = buildStaleOrErrorSnapshot(projectId, diagError ?? caught, false)
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
          lastValid.delete(oldKey)
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

  function scheduleDiagnosticsSync(projectId: ProjectId): void {
    const existing = diagTimers.get(projectId)
    if (existing) {
      clearTimeout(existing)
    }
    diagTimers.set(
      projectId,
      setTimeout(() => {
        diagTimers.delete(projectId)
        if (!isActivated.value) {
          return
        }
        if (snapshots.has(projectId) || hasReferencingDocument(projectId)) {
          void fetchProjectModel(projectId, 'diagnostics changed')
        }
      }, 40),
    )
  }

  useDisposable(
    vscode.languages.onDidChangeDiagnostics((event) => {
      if (!isActivated.value || !projects) {
        return
      }
      const affected = new Set<ProjectId>()
      for (const uri of event.uris) {
        const owner = diagnosticOwnerProject(uri)
        if (owner) {
          affected.add(owner.id)
        }
      }
      for (const projectId of affected) {
        scheduleDiagnosticsSync(projectId)
      }
    }),
  )

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
