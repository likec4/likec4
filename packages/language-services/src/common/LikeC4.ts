import type { LikeC4Model } from '@likec4/core/model'
import type { LayoutedView, NonEmptyArray, ProjectId } from '@likec4/core/types'
import type {
  LikeC4LanguageServices,
  LikeC4ModelBuilder,
  LikeC4Services,
  LikeC4SharedServices,
  LikeC4Views,
  ProjectsManager,
} from '@likec4/language-server'
import { type Logger, rootLogger } from '@likec4/log'
import { map, prop } from 'remeda'
import { DiagnosticSeverity } from 'vscode-languageserver-types'

export interface LikeC4Langium {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
}

export class LikeC4 {
  protected readonly langium: LikeC4Langium

  protected readonly logger: Logger

  constructor(
    langium: LikeC4Langium,
    logger: Logger = rootLogger,
  ) {
    this.langium = langium
    this.logger = logger
  }

  /**
   * File system path to the workspace root
   */
  get workspace() {
    return this.langium.shared.workspace.WorkspaceManager.workspaceUri.fsPath
  }

  /**
   * URI of the workspace root
   */
  get workspaceURI() {
    return this.langium.shared.workspace.WorkspaceManager.workspaceUri
  }

  /**
   * URL of the workspace root
   */
  get workspaceURL() {
    return this.langium.shared.workspace.WorkspaceManager.workspaceURL
  }

  get languageServices(): LikeC4LanguageServices {
    return this.langium.likec4.likec4.LanguageServices
  }

  get projectsManager(): ProjectsManager {
    return this.langium.shared.workspace.ProjectsManager
  }

  get viewsService(): LikeC4Views {
    return this.langium.likec4.likec4.Views
  }

  get modelBuilder(): LikeC4ModelBuilder {
    return this.langium.likec4.likec4.ModelBuilder
  }

  private get LangiumDocuments() {
    return this.langium.shared.workspace.LangiumDocuments
  }

  ensureSingleProject(): void {
    const projects = this.languageServices.projects()
    if (projects.length > 1) {
      this.logger.error(`Multiple projects found:
${projects.map(p => `  - ${p.folder.fsPath}`).join('\n')}

Please specify a project folder`)
      throw new Error(`Multiple projects found`)
    }
  }

  /**
   * Diagram is a computed view, layouted using Graphviz
   * If diagram has manual layout, it will be used.
   * Used in React components
   */
  async diagrams(project?: string | undefined): Promise<LayoutedView[]> {
    const projectId = this.projectsManager.ensureProjectId(project as ProjectId)
    return await this.viewsService.diagrams(projectId as ProjectId)
  }

  /**
   * Builds LikeC4Model from all documents
   * Only computes view predicates {@link ComputedView} - i.e. no layout
   * Not ready for rendering, but enough to traverse
   *
   * Sync version does not read manual layouts
   * Use {@link computedModel} for a version that includes manual layouts
   */
  syncComputedModel(project?: string | undefined): LikeC4Model.Computed {
    const projectId = this.projectsManager.ensureProjectId(project as ProjectId)
    return this.modelBuilder.unsafeSyncComputeModel(projectId)
  }

  /**
   * Builds LikeC4Model from all documents
   * Only computes view predicates {@link ComputedView} - i.e. no layout
   * Not ready for rendering, but enough to traverse
   */
  async computedModel(project?: string | undefined): Promise<LikeC4Model.Computed> {
    const projectId = this.projectsManager.ensureProjectId(project as ProjectId)
    return await this.modelBuilder.computeModel(projectId)
  }

  projects(): NonEmptyArray<ProjectId> {
    return map(this.languageServices.projects(), prop('id'))
  }

  /**
   * Same as {@link computedModel()}, but also applies layout
   * Ready for rendering
   */
  async layoutedModel(project?: string | undefined): Promise<LikeC4Model.Layouted> {
    const projectId = this.projectsManager.ensureProjectId(project as ProjectId)
    return await this.languageServices.layoutedModel(projectId)
  }

  getErrors(): Array<{
    message: string
    line: number
    range: {
      start: { line: number; character: number }
      end: { line: number; character: number }
    }
    sourceFsPath: string
  }> {
    const docs = this.LangiumDocuments.all.toArray()
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

  hasErrors(): boolean {
    return this.LangiumDocuments.all.some(doc => {
      return doc.diagnostics?.some(d => d.severity === DiagnosticSeverity.Error) ?? false
    })
  }

  /**
   * @returns a function to dispose the listener
   */
  onModelUpdate(listener: () => void): () => void {
    const sib = this.modelBuilder.onModelParsed(() => listener())
    return () => {
      sib.dispose()
    }
  }

  async dispose(): Promise<void> {
    await this.languageServices.dispose()
  }

  async [Symbol.asyncDispose]() {
    await this.dispose()
  }
}
