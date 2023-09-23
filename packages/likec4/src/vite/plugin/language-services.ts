import type { ComputedView, DiagramView, LikeC4Model } from '@likec4/core'
import { generateViewsDataJs } from '@likec4/generators'
import {
  createLanguageServices as createLangium,
  logger as lspLogger
} from '@likec4/language-server'
import { DotLayouter } from '@likec4/layouts'
import k from 'kleur'
import { DocumentState, MutexLock, URI } from 'langium'
import { NodeFileSystem } from 'langium/node'
import { existsSync } from 'node:fs'
import { basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { equals, mapObject, mapParallelAsyncWithLimit, values } from 'rambdax'
import { type Logger } from 'vite'

export type LanguageServices = ReturnType<typeof createLanguageServices>

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LanguageServices {
  export function create(logger: Logger) {
    return createLanguageServices(logger)
  }
}

const ERROR = k.bgRed().white().bold('ERROR')

function createLanguageServices(logger: Logger) {
  lspLogger.silent(true)
  const services = createLangium(NodeFileSystem).likec4
  const LangiumDocuments = services.shared.workspace.LangiumDocuments
  const DocumentBuilder = services.shared.workspace.DocumentBuilder
  const modelBuilder = services.likec4.ModelBuilder

  DocumentBuilder.onBuildPhase(DocumentState.Validated, docs => {
    for (const doc of docs) {
      const errors = doc.diagnostics?.filter(e => e.severity === 1)
      if (errors && errors.length > 0) {
        logger.error(`${ERROR}: ${doc.uri.fsPath}`)
        errors.forEach(validationError => {
          const errorRange = doc.textDocument.getText(validationError.range)
          const line = validationError.range.start.line
          logger.error(
            ['   ' + k.dim(`Line ${line}:`) + validationError.message, errorRange].join('\n')
          )
        })
      }
    }
  })

  let initialized = false

  async function init(workspace: string) {
    if (initialized) {
      return
    }
    initialized = true
    if (!existsSync(workspace)) {
      throw new Error(`workspace '${workspace}' does not exist`)
    }
    await services.shared.workspace.WorkspaceManager.initializeWorkspace([
      {
        name: basename(workspace),
        uri: pathToFileURL(workspace).toString()
      }
    ])
    const documents = LangiumDocuments.all.toArray()
    await DocumentBuilder.build(documents, { validation: true })
    logger.info(`LanguageServices initialized`)
  }

  const buildModel = (() => {
    let cachedmodel: LikeC4Model | null = null
    return () => {
      logger.info(`updating model`)
      const freshmodel = modelBuilder.buildModel()
      if (!cachedmodel || !freshmodel) {
        return (cachedmodel = freshmodel)
      }
      const _previous = cachedmodel
      return (cachedmodel = {
        ...freshmodel,
        views: mapObject(view => {
          const _prev = _previous.views[view.id]
          return _prev && equals(_prev, view) ? _prev : view
        }, freshmodel.views) as LikeC4Model['views']
      })
    }
  })()

  const dot = new DotLayouter()
  const DiagramsCache = new WeakMap<ComputedView, DiagramView>()
  let restartsCount = 0
  async function layout(view: ComputedView): Promise<DiagramView> {
    try {
      const diagram = DiagramsCache.get(view) ?? (await dot.layout(view))
      DiagramsCache.set(view, diagram)
      return diagram
    } catch (error) {
      logger.error(`${ERROR}: failed layout ${view.id}`, error instanceof Error ? { error } : {})
      if (restartsCount++ < 10) {
        logger.info(`restarting dot layouter`)
        await dot.restart()
        return await layout(view)
      }
      logger.error(`${ERROR}: Please restart Vite....`)
      throw error
    }
  }

  async function generateCode() {
    const { views } = buildModel() ?? {}
    if (views) {
      const diagrams = await mapParallelAsyncWithLimit(layout, 1, values(views))
      return generateViewsDataJs(diagrams)
    }
    return generateViewsDataJs([])
  }

  let _generateCodeCache: Promise<string> | undefined
  const mutex = new MutexLock()
  // async function updateDocuments({
  //   changed = [],
  //   removed = []
  // }: { changed?: string[]; removed?: string[] }) {
  //   let isSuccess = true
  //   await mutex.lock(async token => {
  //     await DocumentBuilder.update(changed.map(URI.file), removed.map(URI.file), token)
  //     isSuccess =  LangiumDocuments.all.some(doc => doc.diagnostics?.some(e => e.severity === 1))
  //   })
  //   if (isSuccess) {
  //     _generateCodeCache = undefined
  //   }
  //   return { isSuccess }
  // }

  return {
    init,
    watcher: {
      async onUpdate({ changed, removed }: { changed?: string; removed?: string }) {
        let isSuccess = true
        await mutex.lock(async token => {
          await DocumentBuilder.update(
            changed ? [URI.file(changed)] : [],
            removed ? [URI.file(removed)] : [],
            token
          )
          isSuccess = LangiumDocuments.all.some(doc => doc.diagnostics?.some(e => e.severity === 1))
        })
        if (isSuccess) {
          _generateCodeCache = undefined
        }
        return { isSuccess }
      }
    } as const,
    generateCode() {
      return (_generateCodeCache ??= generateCode())
    }
  }
}
