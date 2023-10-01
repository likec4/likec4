import { type ComputedView, type DiagramView, type LikeC4Model } from '@likec4/core'
import {
  createLanguageServices as createLangium,
  logger as lspLogger,
  type LikeC4Services
} from '@likec4/language-server'
import { DotLayouter } from '@likec4/layouts'
import type { WorkspaceCache } from 'langium'
import { DocumentState, MutexLock, URI } from 'langium'
import { NodeFileSystem } from 'langium/node'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { IdentityFunction } from 'rambdax'
import { equals, values } from 'rambdax'
import R from 'remeda'
import { createLogger } from 'vite'
import type { DiagramViewWithPath } from './utils'
import { addDocPaths } from './utils'
import k from 'kleur'

type LanguageParserOptions = {
  /**
   * The directory where c4 files are located.
   */
  workspaceDir: string
}

function mkGetModelFn(services: LikeC4Services) {
  const modelBuilder = services.likec4.ModelBuilder
  const workspaceCache = services.WorkspaceCache as WorkspaceCache<string, LikeC4Model | null>
  let previous: LikeC4Model | null = null

  type Views = Record<string, ComputedView>

  const compareWithCache: IdentityFunction<Views> = R.mapValues(view => {
    const _prev = previous?.views[view.id]
    return _prev && equals(_prev, view) ? _prev : view
  })

  const build = () => {
    const next = modelBuilder.buildModel()
    if (!previous || !next) {
      return (previous = next)
    }
    return (previous = {
      ...next,
      views: compareWithCache(next.views)
    })
  }

  return () => workspaceCache.get('model', build)
}

function mkLayoutFn() {
  const dot = new DotLayouter()
  const cache = new WeakMap<ComputedView, DiagramView>()

  return async (view: ComputedView) => {
    let diagram = cache.get(view)
    if (diagram) {
      return diagram
    }
    diagram = await dot.layout(view)
    cache.set(view, diagram)
    return diagram
  }
}

function mkGetDiagrams(
  getModel: ReturnType<typeof mkGetModelFn>,
  layout: ReturnType<typeof mkLayoutFn>
) {
  return async () => {
    const views = getModel()?.views
    if (!views) {
      return []
    }
    const diagrams = [] as DiagramView[]
    for (const view of values(views)) {
      const diagram = await layout(view)
      diagrams.push(diagram)
    }
    return addDocPaths(diagrams)
  }
}

export async function mkLanguageServices(opts: LanguageParserOptions) {
  const logger = createLogger(undefined, {
    prefix: 'parser'
  })

  lspLogger.silent(true)

  const workspaceDir = resolve(opts.workspaceDir)
  const services = createLangium(NodeFileSystem).likec4
  const LangiumDocuments = services.shared.workspace.LangiumDocuments
  const DocumentBuilder = services.shared.workspace.DocumentBuilder

  DocumentBuilder.onBuildPhase(DocumentState.Validated, docs => {
    for (const doc of docs) {
      const errors = doc.diagnostics?.filter(e => e.severity === 1)
      if (errors && errors.length > 0) {
        logger.error(`${doc.uri.fsPath}`)
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

  const getModel = mkGetModelFn(services)

  const layout = mkLayoutFn()

  const getDiagrams = mkGetDiagrams(getModel, layout)

  const getViews = () => {
    const castedCache = services.WorkspaceCache as WorkspaceCache<
      string,
      Promise<DiagramViewWithPath[]>
    >
    return castedCache.get('views', getDiagrams)
  }

  const mutex = new MutexLock()
  const notifyUpdate = async ({ changed, removed }: { changed?: string; removed?: string }) => {
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
    })
    return isSuccess
  }

  // Initialize workspace

  await services.shared.workspace.WorkspaceManager.initializeWorkspace([
    {
      name: basename(workspaceDir),
      uri: pathToFileURL(workspaceDir).toString()
    }
  ])

  logger.info(`workspace: ${workspaceDir}`, {
    timestamp: true
  })

  const documents = LangiumDocuments.all.toArray()
  if (documents.length === 0) {
    logger.error(`No LikeC4 files found`)
    throw new Error(`No LikeC4 files found`)
  }

  await DocumentBuilder.build(documents, { validation: true })

  return {
    getModel,
    getViews,
    notifyUpdate
  }
}
export type LanguageServices = Awaited<ReturnType<typeof mkLanguageServices>>
