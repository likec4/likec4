import { LikeC4Model, type ParsedLikeC4Model } from '@likec4/core'
import { type LangiumDocuments, URI, UriUtils } from 'langium'
import { resolve } from 'node:path'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { type CreateLanguageServiceOptions, createLanguageServices } from './language/module'
import type { Views } from './language/Views'
import type { Logger } from './logger'

type LikeC4Langium = ReturnType<typeof createLanguageServices>

export class LikeC4 {
  static async initForSource(likec4SourceCode: string, opts?: CreateLanguageServiceOptions) {
    const langium = createLanguageServices({
      useFileSystem: false,
      ...opts
    })

    const workspaceUri = URI.from({
      scheme: 'virtual',
      path: '/workspace'
    })
    const workspaceFolder = {
      name: 'virtual',
      uri: workspaceUri.toString()
    }

    await langium.shared.workspace.WorkspaceManager.initializeWorkspace([workspaceFolder])
    // Workaround to set protected folders property
    Object.assign(langium.shared.workspace.WorkspaceManager, {
      folders: [workspaceFolder]
    })

    const uri = UriUtils.joinPath(workspaceUri, 'source.likec4')
    langium.shared.workspace.LangiumDocuments.createDocument(uri, likec4SourceCode)

    await langium.cli.Workspace.init()

    return new LikeC4(workspaceUri.path, langium)
  }

  /**
   * Prevents multiple instances of LikeC4 for the same workspace
   */
  private static likec4Instances = new Map<string, LikeC4>()

  static async initForWorkspace(path: string, opts?: CreateLanguageServiceOptions) {
    const workspace = resolve(path)
    let likec4 = LikeC4.likec4Instances.get(workspace)
    if (!likec4) {
      const langium = createLanguageServices({
        useFileSystem: true,
        ...opts
      })

      await langium.cli.Workspace.initForWorkspace(workspace)

      likec4 = new LikeC4(workspace, langium)

      LikeC4.likec4Instances.set(workspace, likec4)
    }
    return likec4
  }

  private cache = new WeakMap<ParsedLikeC4Model, LikeC4Model>()

  private logger: Logger
  private langiumDocuments: LangiumDocuments

  public readonly views: Views

  private constructor(
    public readonly workspace: string,
    private langium: LikeC4Langium
  ) {
    this.logger = langium.logger
    this.langiumDocuments = langium.shared.workspace.LangiumDocuments
    this.views = langium.likec4.Views
  }

  async buildComputedModel() {
    return await this.langium.likec4.ModelBuilder.buildComputedModel()
  }

  model() {
    const parsedModel = this.langium.likec4.ModelBuilder.syncBuildModel()
    if (!parsedModel) {
      throw new Error('Failed to build model')
    }
    let model = this.cache.get(parsedModel)
    if (!model) {
      const computedModel = this.langium.likec4.ModelBuilder.syncBuildComputedModel(parsedModel)
      model = LikeC4Model.from(computedModel)
      this.cache.set(parsedModel, model)
    }
    return model
  }

  getErrors() {
    const docs = this.langiumDocuments.all.toArray()
    return docs.flatMap(doc => {
      return (doc.diagnostics ?? [])
        .filter(d => d.severity === DiagnosticSeverity.Error)
        .map(({ message, range }) => ({
          message,
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
   * TODO Replace with watcher
   */
  async notifyUpdate({ changed, removed }: { changed?: string; removed?: string }) {
    const mutex = this.langium.shared.workspace.WorkspaceLock
    try {
      let completed = false
      await mutex.write(async token => {
        await this.langium.shared.workspace.DocumentBuilder.update(
          changed ? [URI.file(changed)] : [],
          removed ? [URI.file(removed)] : [],
          token
        )
        // we come here if only the update was successful (and not cancelled)
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
