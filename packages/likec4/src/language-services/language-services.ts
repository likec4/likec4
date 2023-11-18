import {
  normalizeError,
  type ComputedView,
  type DiagramView,
  type LikeC4Model,
  type ViewID
} from '@likec4/core'
import {
  createLanguageServices as createLangium,
  logger as lspLogger,
  type LikeC4Services
} from '@likec4/language-server'
import { DotLayouter, type DotLayoutResult } from '@likec4/layouts'
import type { LangiumDocument, WorkspaceCache } from 'langium'
import { DocumentState, MutexLock, URI, interruptAndCheck } from 'langium'
import { NodeFileSystem } from 'langium/node'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import k from 'picocolors'
import type { IdentityFunction } from 'rambdax'
import { equals, keys } from 'rambdax'
import * as R from 'remeda'
import type { Logger } from 'vite'
import { createLikeC4Logger } from '../logger'
import pkg from '../../package.json' assert { type: 'json' }

export type LanguageServicesOptions = {
  /**
   * The directory where c4 files are located.
   */
  workspaceDir: string
  logValidationErrors?: boolean
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

function isInvalid(document: LangiumDocument) {
  return document.diagnostics?.some(e => e.severity === 1) ?? false
}

function mkPrintValidationErrors(services: LikeC4Services, logger: Logger) {
  const LangiumDocuments = services.shared.workspace.LangiumDocuments
  /**
   * Returns true if there are some validation errors.
   */
  return (docs = LangiumDocuments.all.toArray()) => {
    let cleanScreenIfError = true
    for (const doc of docs) {
      const errors = doc.diagnostics?.filter(e => e.severity === 1)
      if (errors && errors.length > 0) {
        if (cleanScreenIfError) {
          logger.clearScreen('info')
          cleanScreenIfError = false
        }
        const messages = errors
          .map(validationError => {
            // const errorRange = doc.textDocument.getText(validationError.range)
            const line = validationError.range.start.line
            return '     ' + k.dim(`Line ${line}: `) + k.gray(validationError.message)
          })
          .join('\n')
        logger.error(`invalid ${doc.uri.fsPath}\n${messages}`)
      }
    }
    return cleanScreenIfError !== true
  }
}

export async function mkLanguageServices({
  workspaceDir,
  logValidationErrors = true
}: LanguageServicesOptions) {
  const logger = createLikeC4Logger('c4:lsp ')
  logger.info(`${k.dim('version')} ${pkg.version}`)
  lspLogger.silent(true)

  const workspace = resolve(workspaceDir)
  const services = createLangium(NodeFileSystem).likec4
  const LangiumDocuments = services.shared.workspace.LangiumDocuments
  const DocumentBuilder = services.shared.workspace.DocumentBuilder

  function hasValidationErrors() {
    return LangiumDocuments.all.some(isInvalid)
  }

  const printValidationErrors = mkPrintValidationErrors(services, logger)

  if (logValidationErrors) {
    DocumentBuilder.onBuildPhase(DocumentState.Validated, docs => {
      printValidationErrors(docs)
    })
  }

  const getModel = mkGetModelFn(services)

  const dot = new DotLayouter()
  const dotCache = new WeakMap<ComputedView, DotLayoutResult>()

  async function layoutView(view: ComputedView) {
    let result = dotCache.get(view)
    if (result) {
      return result
    }
    result = await dot.layout(view)
    dotCache.set(view, result)
    return result
  }

  function dotlayouts() {
    const castedCache = services.WorkspaceCache as WorkspaceCache<
      string,
      Promise<DotLayoutResult[]>
    >
    return castedCache.get('dotlayouts', async () => {
      const views = getModel()?.views
      if (!views || keys(views).length === 0) {
        return []
      }
      const results = [] as DotLayoutResult[]
      for (const view of Object.values(views)) {
        try {
          results.push(await layoutView(view))
        } catch (e) {
          const err = normalizeError(e)
          logger.error(`layout failed for ${view.id}: ${err.stack ?? err.message}`)
        }
      }
      return results
    })
  }

  // Returns true if the update was successful
  async function notifyUpdate({ changed, removed }: { changed?: string; removed?: string }) {
    logger.info(`watcher update: ${changed ?? ''} ${removed ?? ''}`)
    try {
      await DocumentBuilder.update(
        changed ? [URI.file(changed)] : [],
        removed ? [URI.file(removed)] : []
      )
      return !hasValidationErrors()
    } catch (e) {
      logger.error(e)
      return false
    }
  }

  // Initialize workspace

  await services.shared.workspace.WorkspaceManager.initializeWorkspace([
    {
      name: basename(workspace),
      uri: pathToFileURL(workspace).toString()
    }
  ])

  logger.info(`${k.dim('workspace:')} ${workspace}`)

  const documents = LangiumDocuments.all.toArray()
  if (documents.length === 0) {
    logger.error(`no LikeC4 sources found`)
    throw new Error(`no LikeC4 sources found`)
  }

  await DocumentBuilder.build(documents, { validation: true })

  if (!hasValidationErrors()) {
    logger.info(k.green(`✓`) + ` ${documents.length} sources parsed`)
  }

  return {
    workspace,
    getModel,
    getViews: () => dotlayouts().then(results => results.map(r => r.diagram)),
    getViewsAsDot: () =>
      dotlayouts().then(
        results => R.fromPairs(results.map(r => [r.diagram.id, r.dot])) as Record<ViewID, string>
      ),
    notifyUpdate,
    hasValidationErrors,
    printValidationErrors: () => printValidationErrors()
  }
}

export type LanguageServices = Awaited<ReturnType<typeof mkLanguageServices>>
