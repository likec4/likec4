import { normalizeError, type ComputedView, type DiagramView, type LikeC4Model } from '@likec4/core'
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
import { basename, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { equals, mapObject, mapParallelAsyncWithLimit, values, delay } from 'rambdax'
import { type Logger } from 'vite'
import { logDebug, logError, logInfo, logWarn } from '../../logger'
import { addDocPaths } from './utils'

export type LanguageServices = ReturnType<typeof createLanguageServices>

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LanguageServices {
  export function create(logger: Logger) {
    return createLanguageServices(logger)
  }
}

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
        logError(`${doc.uri.fsPath}`)
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
    await delay(50)
    const documents = LangiumDocuments.all.toArray()
    if (documents.length === 0) {
      logWarn(`No LikeC4 files found`)
      return
    }
    const found = documents.map(d => '  - ' + relative(workspace, d.uri.path)).join('\n')
    logInfo(`LikeC4: workspace ${workspace}:\n` + found)
    await DocumentBuilder.build(documents, { validation: true })
    logInfo(`LikeC4: initialized`)
  }

  const buildModel = (() => {
    let cachedmodel: LikeC4Model | null = null
    return () => {
      logDebug(`LikeC4: build model`)
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
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Unknown Error: ${err}`, { cause: err })
      logWarn(`failed layout ${view.id}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`)
      if (restartsCount++ < 10) {
        logWarn(`restart graphviz wasm`)
        // await dot.restart()
        const diagram = await layout(view)
        logInfo(`succeed layout ${view.id}`)
        restartsCount = 0
        return diagram
      }
      logError(`please restart Vite....`)
      throw error
    }
  }

  async function generateCode() {
    const { views } = buildModel() ?? {}
    logDebug(`LikeC4: generate code...`)
    if (views) {
      const diagrams = [] as DiagramView[]
      for (const view of values(views)) {
        const diagram = await layout(view)
        diagrams.push(diagram)
      }
      // const diagrams = await mapParallelAsyncWithLimit(layout, 1, values(views))
      return generateViewsDataJs(addDocPaths(diagrams))
    }
    return generateViewsDataJs([])
  }

  let _generateCodeCache: Promise<string> | undefined
  const mutex = new MutexLock()

  return {
    init,

    watcher: {
      async onUpdate({ changed, removed }: { changed?: string; removed?: string }) {
        let isSuccess = false
        await mutex.lock(async token => {
          await DocumentBuilder.update(
            changed ? [URI.file(changed)] : [],
            removed ? [URI.file(removed)] : [],
            token
          )
          isSuccess = LangiumDocuments.all.every(
            doc => !doc.diagnostics || !doc.diagnostics.some(e => e.severity === 1)
          )
          logDebug(`update success=${isSuccess} ${changed ?? removed}`)
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
