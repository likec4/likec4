import { Builder } from '@likec4/core/builder'
import type { AnyTypes, BuilderMode } from '@likec4/core/builder'
import type { LikeC4Model } from '@likec4/core/model'
import type { LayoutedView, NonEmptyArray, ProjectId } from '@likec4/core/types'
import { generate as generateLikeC4Source } from '@likec4/generators/likec4'
import type {
  FormatOptions,
  LikeC4LanguageServices,
  LikeC4ModelBuilder,
  LikeC4Services,
  LikeC4SharedServices,
  LikeC4Views,
  ProjectsManager,
} from '@likec4/language-server'
import { type Logger, rootLogger } from '@likec4/log'
import { flatMap, hasAtLeast, join, map, pipe, prop } from 'remeda'
import k from 'tinyrainbow'

export interface LikeC4Langium {
  shared: LikeC4SharedServices
  likec4: LikeC4Services
}

export type {
  LikeC4LanguageServices,
}

const isErrorDiagnostic = (diagnostic: { severity?: number }): boolean => {
  return diagnostic.severity === 1
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

  /**
   * Returns the parsed model — elements, relations, views, deployments, globals
   * and imports as parsed from DSL, BEFORE view computation or layout.
   *
   * Use this when you need to inspect the raw parsed shape, or as input to
   * {@link toBuilder} for programmatic enrichment.
   */
  async parsedModel(project?: string | undefined): Promise<LikeC4Model.Parsed> {
    const projectId = this.projectsManager.ensureProjectId(project as ProjectId)
    const parsed = await this.modelBuilder.parseModel(projectId)
    if (!parsed) {
      throw new Error(`Failed to parse model for project "${projectId}"`)
    }
    return parsed
  }

  /**
   * Returns a {@link Builder} seeded with the parsed model of the given project.
   *
   * This unblocks programmatic enrichment — you can chain `.model(...)`,
   * `.deployment(...)` and `.views(...)` on the returned builder to add new
   * elements, relations and views on top of what was loaded from DSL.
   *
   * The builder is `editable` by default: re-declaring an element that already
   * exists (same FQN, same kind) edits it in place rather than throwing — which
   * is what you usually want when patching a loaded model. Pass `'strict'` to
   * get the strict builder where duplicate FQNs always throw (see
   * {@link BuilderMode}).
   *
   * Type-safety note: the returned builder is `Builder<AnyTypes>` — element
   * kinds, FQNs, view ids and tags are only known at runtime. See
   * {@link Builder.fromParsed} for details.
   *
   * @example
   * ```ts
   * const likec4 = await LikeC4.fromWorkspace('/path/to/workspace')
   * const enriched = (await likec4.toBuilder())
   *   .model(({ system, component }, _) =>
   *     _(system('monitoring').with(component('grafana'))),
   *   )
   *   .toLikeC4Model()
   *
   * // Strict builder — re-declaring an existing FQN throws:
   * const strict = await likec4.toBuilder('strict')
   * ```
   */
  async toBuilder(mode: BuilderMode = 'editable', project?: string | undefined): Promise<Builder<AnyTypes>> {
    const parsed = await this.parsedModel(project)
    return Builder.fromParsed(parsed.$data, mode)
  }

  /**
   * Renders the parsed model of the given project back to LikeC4 DSL source.
   *
   * The output is a single, formatted `.c4` string containing the specification,
   * model, deployment and views blocks. This round-trip is intentionally LOSSY:
   * comments, source positions and original formatting are not preserved.
   *
   * Useful for "load + patch + emit" workflows where the source of truth is
   * external (e.g. a service catalogue or Terraform state) and DSL files are
   * regenerated wholesale.
   *
   * To write the output to disk, use the `writeDSL` helper from
   * `@likec4/language-services/node`.
   */
  async toDSL(project?: string | undefined): Promise<string> {
    const parsed = await this.parsedModel(project)
    return generateLikeC4Source(parsed.$data as Parameters<typeof generateLikeC4Source>[0])
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
    const docs = [...this.LangiumDocuments.userDocuments]
    return docs.flatMap(doc => {
      const errors = doc.diagnostics?.filter(isErrorDiagnostic) ?? []
      return errors.map(({ message, range }) => ({
        message,
        line: range.start.line,
        range,
        sourceFsPath: doc.uri.fsPath,
      }))
    })
  }

  hasErrors(): boolean {
    return this.LangiumDocuments.userDocuments.some(doc => {
      return doc.diagnostics && doc.diagnostics.some(isErrorDiagnostic)
    })
  }
  /**
   * @returns true if there are errors
   */
  printErrors(): boolean {
    let hasErrors = false
    for (const doc of this.LangiumDocuments.userDocuments) {
      const errors = doc.diagnostics?.filter(isErrorDiagnostic) ?? []
      if (!hasAtLeast(errors, 1)) {
        continue
      }
      hasErrors = true
      const messages = pipe(
        errors,
        flatMap(validationError => {
          const line = validationError.range.start.line
          const messages = validationError.message.split('\n')
          if (messages.length > 5) {
            messages.length = 5
            messages.push('...')
          }
          return messages
            .map((message, i) => {
              if (i === 0) {
                return '    ' + k.dim(`Line ${line}: `) + k.red(message)
              }
              return ' '.repeat(10) + k.red(message)
            })
        }),
        join('\n'),
      )
      this.logger.error(`Invalid ${doc.uri.fsPath}\n${messages}`)
    }
    return hasErrors
  }

  /**
   * Returns the number of parsed documents in the workspace
   */
  documentCount(): number {
    return [...this.LangiumDocuments.userDocuments].length
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

  /**
   * Formats documents and returns a map of document URI → formatted source text.
   *
   * Target selection uses union semantics:
   * - Omit both `projects` and `documentUris` to format **all** documents.
   * - Provide `projects` to include all documents from those projects.
   * - Provide `documentUris` to include specific documents.
   * - Provide both to format the **union** (deduplicated).
   */
  async format(options?: LikeC4FormatOptions): Promise<Map<string, string>> {
    const { projects, ...rest } = options ?? {}
    const formatOptions: FormatOptions = {
      ...rest,
      ...(projects && {
        projectIds: projects.map(p => this.projectsManager.ensureProjectId(p as ProjectId)),
      }),
    }
    return await this.languageServices.format(formatOptions)
  }

  async dispose(): Promise<void> {
    await this.languageServices.dispose()
  }

  async [Symbol.asyncDispose]() {
    await this.dispose()
  }
}

/**
 * Options for {@link LikeC4.format}.
 *
 * Same as {@link FormatOptions} but uses project name strings instead of {@link ProjectId}.
 */
export interface LikeC4FormatOptions {
  /** Include all documents from these projects (by name). */
  projects?: ReadonlyArray<string>
  /** Include these specific documents (by URI string). */
  documentUris?: ReadonlyArray<string>
  /** Size of a tab in spaces (default: 2). */
  tabSize?: number
  /** Prefer spaces over tabs (default: true). */
  insertSpaces?: boolean
  /** Trim trailing whitespace on a line. */
  trimTrailingWhitespace?: boolean
  /** Insert a newline character at the end of the file if one does not exist. */
  insertFinalNewline?: boolean
  /** Trim all newlines after the final newline at the end of the file. */
  trimFinalNewlines?: boolean
}
