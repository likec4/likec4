import type { NonEmptyArray, ProjectId } from '@likec4/core'
import type { LikeC4LanguageServices, LikeC4Views } from '@likec4/language-server'
import { loggable } from '@likec4/log'
import defu from 'defu'
import { URI, UriUtils } from 'langium'
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { hasAtLeast, indexBy, prop } from 'remeda'
import k from 'tinyrainbow'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { createLanguageServices } from './language/module'
import type { Logger } from './logger'
import { type DiagramView, LikeC4Model } from './model'

type LikeC4Langium = ReturnType<typeof createLanguageServices>

export type LikeC4Options = {
  /**
   * By default, if LikeC4 model is invalid, errors are printed to the console.
   * Disable this behavior by setting this option to false.
   *
   * @default true
   */
  printErrors?: boolean
  /**
   * If true, initialization will return rejected promise with the LikeC4 instance.
   * Use `likec4.getErrors()` to get the errors.
   * @default false
   */
  throwIfInvalid?: boolean
  /**
   * Logger to use for the language service.
   * false - no output
   * @default 'default'
   */
  logger?: Logger | 'vite' | 'default' | false
  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'
}

const validationErrorsToError = (likec4: LikeC4) =>
  new Error(
    `Invalid model:\n${
      likec4.getErrors().map(e => `  ${e.sourceFsPath}:${e.line} ${e.message.slice(0, 200)}`).join('\n')
    }`,
  )

export class LikeC4 {
  static async fromSource(likec4SourceCode: string, opts?: LikeC4Options): Promise<LikeC4> {
    const langium = createLanguageServices(
      defu(opts, {
        useFileSystem: false,
        logger: false as const,
        graphviz: 'wasm' as const,
      }),
    )

    const workspaceUri = URI.from({
      scheme: 'virtual',
      path: '/workspace',
    })
    await langium.cli.Workspace.initWorkspace({
      uri: workspaceUri.toString(),
      name: 'virtual',
    })

    const uri = UriUtils.joinPath(workspaceUri, 'source.likec4')
    langium.shared.workspace.LangiumDocuments.createDocument(uri, likec4SourceCode)

    await langium.cli.Workspace.init()

    const likec4 = new LikeC4(workspaceUri.path, langium, opts?.printErrors ?? true)

    if (opts?.throwIfInvalid === true && likec4.hasErrors()) {
      likec4.dispose()
      return Promise.reject(validationErrorsToError(likec4))
    }

    return likec4
  }

  /**
   * Prevents multiple instances of LikeC4 for the same workspace
   */
  private static likec4Instances = new Map<string, LikeC4>()

  /**
   * Initializes a LikeC4 instance from the specified workspace path.
   * By default in current folder
   */
  static async fromWorkspace(path = '', opts?: LikeC4Options): Promise<LikeC4> {
    const workspace = resolve(path)
    if (!existsSync(workspace)) {
      throw new Error(`Workspace not found: ${workspace}`)
    }
    let likec4 = LikeC4.likec4Instances.get(workspace)
    if (!likec4) {
      const langium = createLanguageServices(
        defu(opts, {
          useFileSystem: true,
          logger: 'default' as const,
          graphviz: 'wasm' as const,
        }),
      )

      await langium.cli.Workspace.initWorkspace({
        uri: pathToFileURL(workspace).toString(),
        name: basename(workspace),
      })

      await langium.cli.Workspace.init()

      likec4 = new LikeC4(workspace, langium, opts?.printErrors ?? true)
      LikeC4.likec4Instances.set(workspace, likec4)
    }

    if (opts?.throwIfInvalid === true && likec4.hasErrors()) {
      likec4.dispose()
      return Promise.reject(validationErrorsToError(likec4))
    }

    return likec4
  }

  private logger: Logger

  private constructor(
    public readonly workspace: string,
    public readonly langium: LikeC4Langium,
    private isPrintErrorEnabled: boolean,
  ) {
    this.logger = langium.logger
    if (this.isPrintErrorEnabled) {
      this.printErrors()
    }
  }

  get languageServices(): LikeC4LanguageServices {
    return this.langium.likec4.LanguageServices
  }

  get viewsService(): LikeC4Views {
    return this.langium.likec4.Views
  }

  private get LangiumDocuments() {
    return this.langium.shared.workspace.LangiumDocuments
  }

  ensureSingleProject(): void {
    const projects = this.langium.likec4.LanguageServices.projects()
    if (projects.length > 1) {
      this.logger.error(`Multiple projects found:
${projects.map(p => `  - ${p.folder.fsPath}`).join('\n')}

${k.red('Please specify a project folder')}
`)
      throw new Error(`Multiple projects found`)
    }
  }

  /**
   * Diagram is a computed view, layouted using Graphviz
   * Used in React components
   */
  async diagrams(): Promise<DiagramView[]> {
    return await this.langium.likec4.Views.diagrams()
  }

  /**
   * Builds LikeC4Model from all documents
   * Only computes view predicates {@link ComputedView} - i.e. no layout
   * Not ready for rendering, but enough to traverse
   */
  computedModel(project?: ProjectId | undefined): LikeC4Model.Computed {
    const projectId = this.langium.shared.workspace.ProjectsManager.ensureProjectId(project)
    return this.langium.likec4.ModelBuilder.unsafeSyncBuildModel(projectId)
  }

  async projects(): Promise<NonEmptyArray<ProjectId>> {
    const defaultId = this.langium.shared.workspace.ProjectsManager.defaultProjectId
    if (defaultId) {
      return [defaultId]
    }
    const projects = await Promise.allSettled(
      this.langium.shared.workspace.ProjectsManager.all.map(async projectId => {
        const model = await this.langium.likec4.ModelBuilder.parseModel(projectId)
        return model ? projectId : undefined
      }),
    )
    const validProjects = projects.filter(p => p.status === 'fulfilled').flatMap(p => p.value ?? [])
    if (hasAtLeast(validProjects, 1)) {
      return validProjects
    }
    return ['default' as ProjectId]
  }

  /**
   * Same as {@link computedModel()}, but also applies layout
   * Ready for rendering
   */
  async layoutedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Layouted> {
    const projectId = this.langium.shared.workspace.ProjectsManager.ensureProjectId(project)
    const parsed = await this.langium.likec4.ModelBuilder.parseModel(projectId)
    if (!parsed) {
      throw new Error('Failed to parse model')
    }
    const diagrams = await this.viewsService.diagrams(projectId)
    return LikeC4Model.create({
      ...parsed,
      __: 'layouted' as const,
      views: indexBy(diagrams, prop('id')),
    })
  }

  getErrors() {
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
   * @returns true if there are errors
   */
  printErrors(): boolean {
    let hasErrors = false
    for (const doc of this.LangiumDocuments.all) {
      const errors = doc.diagnostics?.filter(e => e.severity === 1)
      if (errors && errors.length > 0) {
        hasErrors = true
        const messages = errors
          .flatMap(validationError => {
            const line = validationError.range.start.line
            const messages = validationError.message.split('\n')
            if (messages.length > 10) {
              messages.length = 10
              messages.push('...')
            }
            return messages
              .map((message, i) => {
                if (i === 0) {
                  return '    ' + k.dim(`Line ${line}: `) + k.red(message)
                }
                return ' '.repeat(10) + k.red(message)
              })
          })
          .join('\n')
        this.logger.error(`Invalid ${doc.uri.fsPath}\n${messages}`)
      }
    }
    return hasErrors
  }

  /**
   * TODO Replace with watcher
   */
  async notifyUpdate({ changed, removed }: { changed?: string; removed?: string }): Promise<boolean> {
    const mutex = this.langium.shared.workspace.WorkspaceLock
    try {
      let completed = false
      await mutex.write(async token => {
        await this.langium.shared.workspace.DocumentBuilder.update(
          changed ? [URI.file(changed)] : [],
          removed ? [URI.file(removed)] : [],
          token,
        )
        // we come here if only the update was successful, did not throw and not cancelled
        completed = !token.isCancellationRequested
      })
      return completed
    } catch (e) {
      this.logger.error(loggable(e))
      return false
    }
  }

  /**
   * @returns a function to dispose the listener
   */
  onModelUpdate(listener: () => void): () => void {
    const sib = this.langium.likec4.ModelBuilder.onModelParsed(() => listener())
    return () => {
      sib.dispose()
    }
  }

  dispose(): void {
    for (const [path, likec4] of LikeC4.likec4Instances) {
      if (likec4 === this) {
        LikeC4.likec4Instances.delete(path)
      }
    }
  }
}
