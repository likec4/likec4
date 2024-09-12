import { LikeC4Model } from '@likec4/core'
import defu from 'defu'
import { type LangiumDocuments, URI, UriUtils } from 'langium'
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { indexBy, prop } from 'remeda'
import k from 'tinyrainbow'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { createLanguageServices } from './language/module'
import type { Views } from './language/Views'
import type { Logger } from './logger'

type LikeC4Langium = ReturnType<typeof createLanguageServices>

type LikeC4Options = {
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
    }`
  )

export class LikeC4 {
  static async fromSource(likec4SourceCode: string, opts?: LikeC4Options) {
    const langium = createLanguageServices(
      defu(opts, {
        useFileSystem: false,
        logger: false as const,
        graphviz: 'wasm' as const
      })
    )

    const workspaceUri = URI.from({
      scheme: 'virtual',
      path: '/workspace'
    })
    await langium.cli.Workspace.initWorkspace({
      uri: workspaceUri.toString(),
      name: 'virtual'
    })

    const uri = UriUtils.joinPath(workspaceUri, 'source.likec4')
    langium.shared.workspace.LangiumDocuments.createDocument(uri, likec4SourceCode)

    await langium.cli.Workspace.init()

    const likec4 = new LikeC4(workspaceUri.path, langium, opts?.printErrors ?? true)

    if (opts?.throwIfInvalid === true && likec4.hasErrors()) {
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
  static async fromWorkspace(path = '', opts?: LikeC4Options) {
    const workspace = resolve(path)
    if (!existsSync(workspace)) {
      throw new Error(`Workspace not found: ${workspace}`)
    }
    let likec4 = LikeC4.likec4Instances.get(workspace)
    if (!likec4) {
      const langium = createLanguageServices({
        useFileSystem: true,
        ...opts
      })

      await langium.cli.Workspace.initWorkspace({
        uri: pathToFileURL(workspace).toString(),
        name: basename(workspace)
      })

      await langium.cli.Workspace.init()

      likec4 = new LikeC4(workspace, langium, opts?.printErrors ?? true)
      LikeC4.likec4Instances.set(workspace, likec4)
    }

    if (opts?.throwIfInvalid === true && likec4.hasErrors()) {
      return Promise.reject(validationErrorsToError(likec4))
    }

    return likec4
  }

  // private cachedModelComputed: LikeC4Model.Computed | undefined
  // private cachedModelLayouted: LikeC4Model.Layouted | undefined
  private modelComputedRef: WeakRef<LikeC4Model.Computed> | undefined
  private modelLayoutedRef: WeakRef<LikeC4Model.Layouted> | undefined
  private logger: Logger
  private langiumDocuments: LangiumDocuments

  public readonly views: Views

  private constructor(
    public readonly workspace: string,
    private langium: LikeC4Langium,
    private isPrintErrorEnabled: boolean
  ) {
    this.logger = langium.logger
    this.langiumDocuments = langium.shared.workspace.LangiumDocuments
    this.views = langium.likec4.Views

    if (this.isPrintErrorEnabled) {
      this.printErrors()
    }
  }

  async buildComputedModel() {
    return await this.langium.likec4.ModelBuilder.buildComputedModel()
  }

  /**
   * Diagram is a computed view, layouted using Graphviz
   * Used in React components
   */
  async diagrams() {
    return await this.langium.likec4.Views.diagrams()
  }

  /**
   * @deprecated use computedModel
   */
  model() {
    return this.computedModel()
  }

  /**
   * Synchronously builds architecture model
   * Only compute views predicates {@link ComputedView} - i.e. no layout
   * Not ready for rendering, but enough to traverse
   */
  computedModel() {
    let ref = this.modelComputedRef?.deref()
    if (!ref) {
      const parsedModel = this.langium.likec4.ModelBuilder.unsafeSyncBuildModel()
      if (!parsedModel) {
        throw new Error('Failed to build model')
      }
      const computedModel = this.langium.likec4.ModelBuilder.unsafeSyncBuildComputedModel(parsedModel)
      ref = LikeC4Model.computed(computedModel)
      this.modelComputedRef = new WeakRef(ref)
    }
    return ref
  }

  /**
   * Same as {@link computedModel()}, after applies layout
   * Ready for rendering
   */
  async layoutedModel() {
    let ref = this.modelLayoutedRef?.deref()
    if (!ref) {
      const computedModel = await this.langium.likec4.ModelBuilder.buildComputedModel()
      if (!computedModel) {
        throw new Error('Failed to build model')
      }
      const diagrams = await this.views.diagrams()
      ref = LikeC4Model.layouted({
        ...computedModel,
        views: indexBy(diagrams, prop('id'))
      })
      this.modelLayoutedRef = new WeakRef(ref)
    }
    return ref
  }

  getErrors() {
    const docs = this.langiumDocuments.all.toArray()
    return docs.flatMap(doc => {
      return (doc.diagnostics ?? [])
        .filter(d => d.severity === DiagnosticSeverity.Error)
        .map(({ message, range }) => ({
          message,
          line: range.start.line,
          range,
          sourceFsPath: doc.uri.fsPath
        }))
    })
  }

  hasErrors() {
    return this.langiumDocuments.all.some(doc => {
      return (doc.diagnostics ?? []).some(d => d.severity === DiagnosticSeverity.Error)
    })
  }

  /**
   * @returns true if there are errors
   */
  printErrors() {
    let hasErrors = false
    for (const doc of this.langiumDocuments.all) {
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
  async notifyUpdate({ changed, removed }: { changed?: string; removed?: string }) {
    this.modelLayoutedRef = undefined
    this.modelComputedRef = undefined
    const mutex = this.langium.shared.workspace.WorkspaceLock
    try {
      let completed = false
      await mutex.write(async token => {
        await this.langium.shared.workspace.DocumentBuilder.update(
          changed ? [URI.file(changed)] : [],
          removed ? [URI.file(removed)] : [],
          token
        )
        // we come here if only the update was successful, did not throw and not cancelled
        completed = !token.isCancellationRequested
      })
      return completed
    } catch (e) {
      this.logger.error(e)
      return false
    }
  }

  onModelUpdate(listener: () => void) {
    const sib = this.langium.likec4.ModelBuilder.onModelParsed(() => listener())
    return () => {
      sib.dispose()
    }
  }

  dispose() {
    for (const [path, likec4] of LikeC4.likec4Instances) {
      if (likec4 === this) {
        LikeC4.likec4Instances.delete(path)
      }
    }
  }
}
