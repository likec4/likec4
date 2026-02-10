import { LikeC4Model } from '@likec4/core/model'
import type { LayoutedView, NonEmptyArray, ProjectId } from '@likec4/core/types'
import type {
  LikeC4LanguageServices,
  LikeC4Services,
  LikeC4SharedServices,
  LikeC4Views,
  ProjectsManager,
} from '@likec4/language-server'
import type { Logger } from '@likec4/log'
import { map, prop } from 'remeda'
import { DiagnosticSeverity } from 'vscode-languageserver-types'

export interface LikeC4Langium {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
}

export abstract class AbstractLikeC4 {
  protected abstract langium: LikeC4Langium

  protected abstract logger: Logger

  get languageServices(): LikeC4LanguageServices {
    return this.langium.likec4.likec4.LanguageServices
  }

  get projectsManager(): ProjectsManager {
    return this.langium.shared.workspace.ProjectsManager
  }

  get viewsService(): LikeC4Views {
    return this.langium.likec4.likec4.Views
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
  async diagrams(projectId?: ProjectId | undefined): Promise<LayoutedView[]> {
    return await this.viewsService.diagrams(projectId)
  }

  /**
   * Builds LikeC4Model from all documents
   * Only computes view predicates {@link ComputedView} - i.e. no layout
   * Not ready for rendering, but enough to traverse
   *
   * Sync version does not read manual layouts
   * Use {@link computedModel} for a version that includes manual layouts
   */
  syncComputedModel(project?: ProjectId | undefined): LikeC4Model.Computed {
    const projectId = this.langium.shared.workspace.ProjectsManager.ensureProjectId(project)
    return this.langium.likec4.likec4.ModelBuilder.unsafeSyncComputeModel(projectId)
  }

  /**
   * Builds LikeC4Model from all documents
   * Only computes view predicates {@link ComputedView} - i.e. no layout
   * Not ready for rendering, but enough to traverse
   */
  async computedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Computed> {
    return await this.langium.likec4.likec4.ModelBuilder.computeModel(project)
  }

  projects(): NonEmptyArray<ProjectId> {
    return map(this.langium.likec4.likec4.LanguageServices.projects(), prop('id'))
  }

  /**
   * Same as {@link computedModel()}, but also applies layout
   * Ready for rendering
   */
  async layoutedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Layouted> {
    return await this.langium.likec4.likec4.LanguageServices.layoutedModel(project)
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
    const sib = this.langium.likec4.likec4.ModelBuilder.onModelParsed(() => listener())
    return () => {
      sib.dispose()
    }
  }

  async dispose(): Promise<void> {
    await this.langium.likec4.likec4.LanguageServices.dispose()
  }

  async [Symbol.asyncDispose]() {
    await this.dispose()
  }
}

export interface LikeC4 extends AbstractLikeC4 {
}
