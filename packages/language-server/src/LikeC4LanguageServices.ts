import type { LikeC4ProjectConfig } from '@likec4/config'
import {
  type DiagramView,
  type NonEmptyArray,
  type ProjectId,
  nonexhaustive,
} from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import { loggable } from '@likec4/log'
import { type LangiumDocument, URI } from 'langium'
import { entries, hasAtLeast, indexBy, map, pipe, prop } from 'remeda'
import type { CancellationToken } from 'vscode-jsonrpc'
import type { Range } from 'vscode-languageserver-types'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { isLikeC4LangiumDocument } from './ast'
import { logger as mainLogger, logWarnError } from './logger'
import type { LikeC4ModelBuilder } from './model'
import type { LikeC4Services } from './module'
import type { Locate } from './protocol'
import type { LikeC4Views } from './views/LikeC4Views'
import { ProjectsManager } from './workspace'

const logger = mainLogger.getChild('LanguageServices')

export interface LikeC4LanguageServices {
  readonly views: LikeC4Views
  readonly builder: LikeC4ModelBuilder
  readonly workspaceUri: URI
  readonly projectsManager: ProjectsManager

  /**
   * Returns all projects with relevant documents
   */
  projects(): NonEmptyArray<{
    id: ProjectId
    folder: URI
    title: string
    documents: ReadonlyArray<URI>
    config: Readonly<LikeC4ProjectConfig>
  }>

  /**
   * Returns project by ID
   * If no project ID is specified, returns default project
   */
  project(projectId?: ProjectId): {
    id: ProjectId
    folder: URI
    title: string
    documents: ReadonlyArray<URI>
    config: Readonly<LikeC4ProjectConfig>
  }

  /**
   * Returns diagrams (i.e. views with layout computed) for the specified project
   * If no project is specified, returns diagrams for default project
   */
  diagrams(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<DiagramView[]>

  computedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model.Computed>

  layoutedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model.Layouted>

  getErrors(): Array<{
    message: string
    line: number
    range: Range
    sourceFsPath: string
  }>

  /**
   * Notifies the language server about changes in the workspace
   * @deprecated use watcher instead
   */
  notifyUpdate(update: { changed?: string; removed?: string }): Promise<boolean>

  /**
   * Returns the location of the specified element, relation, view or deployment element
   */
  locate(params: Locate.Params): Locate.Res

  /**
   * Checks if the specified document should be excluded from processing.
   */
  isExcluded(doc: LangiumDocument): boolean

  dispose(): Promise<void>
}

/**
 * Public Language Services
 */
export class DefaultLikeC4LanguageServices implements LikeC4LanguageServices {
  public readonly builder: LikeC4ModelBuilder

  public readonly projectsManager: ProjectsManager

  constructor(private services: LikeC4Services) {
    this.builder = services.likec4.ModelBuilder
    this.projectsManager = services.shared.workspace.ProjectsManager
  }

  get views(): LikeC4Views {
    return this.services.likec4.Views
  }

  get workspaceUri(): URI {
    return this.services.shared.workspace.WorkspaceManager.workspaceUri
  }

  projects(): NonEmptyArray<{
    id: ProjectId
    folder: URI
    title: string
    documents: ReadonlyArray<URI>
    config: LikeC4ProjectConfig
  }> {
    const projectsManager = this.services.shared.workspace.ProjectsManager
    const projectsWithDocs = pipe(
      this.services.shared.workspace.LangiumDocuments.groupedByProject(),
      entries(),
      map(([projectId, docs]) => {
        const id = projectId as ProjectId
        const { folderUri, config } = projectsManager.getProject(id)
        return {
          id,
          folder: folderUri,
          title: config.title ?? config.name,
          documents: map(docs, prop('uri')),
          config,
        }
      }),
    )
    // if there are multiple projects and default project is set, ensure it is first
    if (hasAtLeast(projectsWithDocs, 2) && projectsManager.defaultProjectId) {
      const idx = projectsWithDocs.findIndex(p => p.id === projectsManager.defaultProjectId)
      if (idx > 0) {
        const [defaultProject] = projectsWithDocs.splice(idx, 1)
        return [defaultProject!, ...projectsWithDocs]
      }
      return projectsWithDocs
    }
    if (hasAtLeast(projectsWithDocs, 1)) {
      return projectsWithDocs
    }
    const { folderUri, config } = projectsManager.getProject(ProjectsManager.DefaultProjectId)
    const documents = map(
      this.services.shared.workspace.LangiumDocuments.projectDocuments(ProjectsManager.DefaultProjectId).toArray(),
      prop('uri'),
    )
    return [{
      id: ProjectsManager.DefaultProjectId,
      folder: folderUri,
      title: config.title ?? config.name,
      documents,
      config,
    }]
  }

  project(projectId?: ProjectId): {
    id: ProjectId
    folder: URI
    title: string
    documents: ReadonlyArray<URI>
    config: LikeC4ProjectConfig
  } {
    projectId = this.projectsManager.ensureProjectId(projectId)
    const projectsManager = this.services.shared.workspace.ProjectsManager
    const { folderUri, config } = projectsManager.getProject(projectId)
    const documents = map(
      this.services.shared.workspace.LangiumDocuments.projectDocuments(projectId).toArray(),
      prop('uri'),
    )
    return {
      id: projectId,
      folder: folderUri,
      title: config.title ?? config.name,
      documents,
      config,
    }
  }

  /**
   * Diagram is a computed view, layouted using Graphviz
   * If diagram has manual layout, it will be used.
   */
  async diagrams(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<DiagramView[]> {
    const projectId = this.projectsManager.ensureProjectId(project)
    return await this.views.diagrams(projectId, cancelToken)
  }

  /**
   * Builds LikeC4Model from all documents
   * Only computes view predicates {@link ComputedView} - i.e. no layout
   * Not ready for rendering, but enough to traverse
   */
  async computedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model.Computed> {
    const projectId = this.projectsManager.ensureProjectId(project)
    return await this.builder.computeModel(projectId, cancelToken)
  }

  /**
   * Same as {@link computedModel()}, but also applies layout
   * Ready for rendering
   */
  async layoutedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model.Layouted> {
    const projectId = this.projectsManager.ensureProjectId(project)
    const model = await this.builder.computeModel(projectId, cancelToken)
    if (!model) {
      throw new Error('Failed to parse model')
    }
    const layouted = await this.views.layoutAllViews(projectId, cancelToken)
    return LikeC4Model.create({
      ...model.$data,
      _stage: 'layouted' as const,
      views: pipe(
        layouted,
        map(prop('diagram')),
        indexBy(prop('id')),
      ),
    })
  }

  getErrors(): Array<{
    message: string
    line: number
    range: Range
    sourceFsPath: string
  }> {
    const docs = this.services.shared.workspace.LangiumDocuments.allExcludingBuiltin.toArray()
    return docs.flatMap(doc => {
      return (doc.diagnostics ?? [])
        .filter(d => d.severity === DiagnosticSeverity.Error)
        .map(({ message, range }) => ({
          message,
          line: range.start.line,
          range,
          sourceFsPath: doc.uri.fsPath,
        }))
    })
  }

  /**
   * TODO Replace with watcher
   */
  async notifyUpdate({ changed, removed }: { changed?: string; removed?: string }): Promise<boolean> {
    if (!changed && !removed) {
      return false
    }
    const _changed = changed ? URI.file(changed) : undefined
    const _removed = removed ? URI.file(removed) : undefined

    const pm = this.services.shared.workspace.ProjectsManager
    if ((_changed && pm.isConfigFile(_changed)) || (_removed && pm.isConfigFile(_removed))) {
      await pm.reloadProjects()
      return true
    }

    const mutex = this.services.shared.workspace.WorkspaceLock
    try {
      let completed = false
      await mutex.write(async token => {
        await this.services.shared.workspace.DocumentBuilder.update(
          _changed ? [_changed] : [],
          _removed ? [_removed] : [],
          token,
        )
        // we come here if only the update was successful, did not throw and not cancelled
        completed = !token.isCancellationRequested
      })
      return completed
    } catch (e) {
      logger.error(loggable(e))
      return false
    }
  }

  locate(params: Locate.Params): Locate.Res {
    switch (true) {
      case 'element' in params:
        return this.services.likec4.ModelLocator.locateElement(params.element, params.projectId as ProjectId)
      case 'relation' in params:
        return this.services.likec4.ModelLocator.locateRelation(params.relation, params.projectId as ProjectId)
      case 'view' in params:
        return this.services.likec4.ModelLocator.locateView(params.view, params.projectId as ProjectId)
      case 'deployment' in params:
        return this.services.likec4.ModelLocator.locateDeploymentElement(
          params.deployment,
          params.projectId as ProjectId,
        )
      default:
        nonexhaustive(params)
    }
  }

  /**
   * Checks if the specified document should be excluded from processing.
   */
  isExcluded(doc: LangiumDocument): boolean {
    try {
      return !isLikeC4LangiumDocument(doc) || this.services.shared.workspace.ProjectsManager.checkIfExcluded(doc)
    } catch (e) {
      logWarnError(e)
      return false
    }
  }

  async dispose(): Promise<void> {
    try {
      logger.debug('disposing LikeC4LanguageServices')
      await this.services.shared.workspace.FileSystemWatcher.dispose()
      if (this.services.mcp.Server.isStarted) {
        await this.services.mcp.Server.stop()
      }
      this.services.Rpc.dispose()
      this.services.likec4.ModelBuilder.dispose()
      logger.debug('LikeC4LanguageServices disposed')
    } catch (e) {
      logger.error(loggable(e))
    }
  }
}
