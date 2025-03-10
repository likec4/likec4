import { type DiagramView, type NonEmptyArray, type ProjectId, LikeC4Model } from '@likec4/core'
import { loggable } from '@likec4/log'
import { URI } from 'langium'
import { entries, hasAtLeast, indexBy, map, pipe, prop } from 'remeda'
import { type Range, DiagnosticSeverity } from 'vscode-languageserver-types'
import type { ProjectConfig } from './config'
import { logger as mainLogger } from './logger'
import type { LikeC4ModelBuilder } from './model'
import type { LikeC4Services } from './module'
import type { LikeC4Views } from './views/likec4-views'
import { ProjectsManager } from './workspace'

const logger = mainLogger.getChild('LikeC4LanguageServices')

/**
 * Public Language Services
 */
export class LikeC4LanguageServices {
  public readonly views: LikeC4Views
  public readonly builder: LikeC4ModelBuilder

  private projectsManager: ProjectsManager

  constructor(private services: LikeC4Services) {
    this.views = services.likec4.Views
    this.builder = services.likec4.ModelBuilder
    this.projectsManager = services.shared.workspace.ProjectsManager
  }

  get workspaceUri(): URI {
    return this.services.shared.workspace.WorkspaceManager.workspaceUri
  }

  projects(): NonEmptyArray<{
    id: ProjectId
    folder: URI
    config: ProjectConfig
    documents: NonEmptyArray<URI> | null
  }> {
    const projectsManager = this.services.shared.workspace.ProjectsManager
    const projectsWithDocs = pipe(
      this.services.shared.workspace.LangiumDocuments.groupedByProject(),
      entries(),
      map(([projectId, docs]) => {
        const id = projectId as ProjectId
        const { folder, config } = projectsManager.getProject(id)
        return {
          id,
          folder,
          config,
          documents: map(docs, prop('uri')),
        }
      }),
    )
    if (hasAtLeast(projectsWithDocs, 1)) {
      return projectsWithDocs
    }
    return [{
      id: ProjectsManager.DefaultProjectId,
      folder: this.services.shared.workspace.WorkspaceManager.workspaceUri,
      config: {
        name: 'default',
      },
      documents: null,
    }]
  }

  /**
   * Diagram is a computed view, layouted using Graphviz
   * Used in React components
   */
  async diagrams(): Promise<DiagramView[]> {
    return await this.views.diagrams()
  }

  /**
   * Builds LikeC4Model from all documents
   * Only computes view predicates {@link ComputedView} - i.e. no layout
   * Not ready for rendering, but enough to traverse
   */
  async computedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Computed> {
    const projectId = this.projectsManager.ensureProjectId(project)
    return await this.builder.buildLikeC4Model(projectId)
  }

  /**
   * Same as {@link computedModel()}, but also applies layout
   * Ready for rendering
   */
  async layoutedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Layouted> {
    const projectId = this.projectsManager.ensureProjectId(project)
    const parsed = await this.builder.parseModel(projectId)
    if (!parsed) {
      throw new Error('Failed to parse model')
    }
    const diagrams = await this.views.diagrams(projectId)
    return LikeC4Model.create({
      ...parsed,
      __: 'layouted' as const,
      views: indexBy(diagrams, prop('id')),
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
    const mutex = this.services.shared.workspace.WorkspaceLock
    try {
      let completed = false
      await mutex.write(async token => {
        await this.services.shared.workspace.DocumentBuilder.update(
          changed ? [URI.file(changed)] : [],
          removed ? [URI.file(removed)] : [],
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
}
