import type { LikeC4ProjectConfig } from '@likec4/config'
import {
  type LayoutedView,
  type NonEmptyArray,
  type ProjectId,
  type UnknownComputed,
  type UnknownLayouted,
  nonexhaustive,
} from '@likec4/core'
import { type LayoutedProjectsView, computeProjectsView } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import { loggable } from '@likec4/log'
import { URI } from 'langium'
import { entries, filter, flatMap, hasAtLeast, indexBy, map, pipe, prop } from 'remeda'
import type { CancellationToken } from 'vscode-jsonrpc'
import type { Diagnostic, Range } from 'vscode-languageserver-types'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { logger as mainLogger } from './logger'
import type { LikeC4ModelBuilder } from './model'
import type { LikeC4ModelChanges } from './model-change/ModelChanges'
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
  readonly editor: LikeC4ModelChanges

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
   * Returns project by ID, returns default project if no ID is specified
   */
  project(projectId?: ProjectId): {
    id: ProjectId
    folder: URI
    title: string
    documents: ReadonlyArray<URI>
    config: Readonly<LikeC4ProjectConfig>
  }

  /**
   * Computes and layouts projects overview - a special diagram
   * that shows all projects and their relationships
   */
  projectsOverview(cancelToken?: CancellationToken): Promise<LayoutedProjectsView>

  /**
   * Returns {@link LikeC4Model} of the specified project, with computed views {@link ComputedView}
   * Not ready for rendering, but enough to traverse model. Much faster than {@link layoutedModel}
   *
   * If no {@link project} is specified, returns for default project
   */
  computedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownComputed>>

  /**
   * Returns {@link LikeC4Model} of the specified project, with layouted views {@link LayoutedView}
   * Ready for rendering. Applies manual layouts if available.
   *
   * If no {@link project} is specified, returns for default project
   */
  layoutedModel(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model<UnknownLayouted>>

  /**
   * Returns diagrams (i.e. layouted views {@link LayoutedView}) for the specified project
   * Applies manual layouts if available.
   *
   * If no {@link project} is specified, returns diagrams for default project
   */
  diagrams(project?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<LayoutedView[]>

  getErrors(): Array<{
    message: string
    line: number
    range: Range
    sourceFsPath: string
  }>

  /**
   * Returns the location of the specified element, relation, view or deployment element
   */
  locate(params: Locate.Params): Locate.Res

  dispose(): Promise<void>
}

const isErrorDiagnostic = (d: Diagnostic) => d.severity === DiagnosticSeverity.Error

/**
 * Public Language Services
 */
export class DefaultLikeC4LanguageServices implements LikeC4LanguageServices {
  public readonly builder: LikeC4ModelBuilder
  public readonly editor: LikeC4ModelChanges
  public readonly projectsManager: ProjectsManager

  constructor(private services: LikeC4Services) {
    this.builder = services.likec4.ModelBuilder
    this.projectsManager = services.shared.workspace.ProjectsManager
    this.editor = services.likec4.ModelChanges
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
    const { id, folderUri, config } = projectsManager.default
    return [{
      id,
      folder: folderUri,
      title: config.title ?? config.name,
      documents: [],
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
    const { id, folderUri, config } = this.projectsManager.ensureProject(projectId)
    const documents = map(
      this.services.shared.workspace.LangiumDocuments.projectDocuments(id).toArray(),
      prop('uri'),
    )
    return {
      id,
      folder: folderUri,
      title: config.title ?? config.name,
      documents,
      config,
    }
  }

  async diagrams(
    project?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LayoutedView<UnknownLayouted>[]> {
    const projectId = this.projectsManager.ensureProjectId(project)
    return await this.views.diagrams(projectId, cancelToken)
  }

  async computedModel(
    project?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownComputed>> {
    const projectId = this.projectsManager.ensureProjectId(project)
    return await this.builder.computeModel(projectId, cancelToken)
  }

  async layoutedModel(
    project?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownLayouted>> {
    const projectId = this.projectsManager.ensureProjectId(project)
    const model = await this.builder.computeModel(projectId, cancelToken)
    if (!model) {
      throw new Error('Failed to compute model, empty project?')
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

  async projectsOverview(cancelToken?: CancellationToken): Promise<LayoutedProjectsView> {
    const allProjects = this.services.shared.workspace.ProjectsManager.all
    const models = [] as LikeC4Model[]
    for (const project of allProjects) {
      const model = await this.builder.computeModel(project, cancelToken)
      if (cancelToken?.isCancellationRequested) {
        throw new Error('Operation cancelled')
      }
      if (model === LikeC4Model.EMPTY) {
        logger.debug(`Project ${project} is empty, skipping`)
        continue
      }
      models.push(model)
    }
    if (!hasAtLeast(models, 1)) {
      throw new Error('No models found')
    }
    const projectsView = computeProjectsView(models)
    return await this.views.layouter.layoutProjectsView(projectsView)
  }

  getErrors(): Array<{
    message: string
    line: number
    range: Range
    sourceFsPath: string
  }> {
    return pipe(
      this.services.shared.workspace.LangiumDocuments.userDocuments.toArray(),
      flatMap(doc => {
        return pipe(
          doc.diagnostics ?? [],
          filter(isErrorDiagnostic),
          map(({ message, range }) => ({
            message,
            line: range.start.line,
            range,
            sourceFsPath: doc.uri.fsPath,
          })),
        )
      }),
    )
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

  async dispose(): Promise<void> {
    try {
      logger.debug('disposing LikeC4LanguageServices')
      await this.services.shared.workspace.FileSystemWatcher.dispose()
      if (this.services.mcp.Server.isStarted) {
        await this.services.mcp.Server.stop()
      }
      this.services.Rpc.dispose()
      this.services.likec4.ModelBuilder.dispose()
    } catch (e) {
      logger.error(loggable(e))
    } finally {
      logger.debug('LikeC4LanguageServices disposed')
    }
  }
}
