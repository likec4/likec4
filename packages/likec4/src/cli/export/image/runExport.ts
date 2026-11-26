// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { DiagramView } from '@likec4/core'
import type { Page } from 'playwright'
import type { ViteDevServer } from 'vite'
import { relative } from 'node:path'
import { hrtime } from 'node:process'
import { fromWorkspace } from '@likec4/language-services/node'
import picomatch from 'picomatch'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import { joinURL, withTrailingSlash } from 'ufo'
import { resolveAppConfig } from '../../../app-config'
import { type ViteLogger, inMillis } from '../../../logger'
import { resolveServerUrl } from '../../../vite/printServerUrls'
import { relativeToCwd } from '../../../vite/utils'
import { viteDev } from '../../../vite/vite-dev'
import { ScreenshotBrowser } from './ScreenshotBrowser'
import { ScreenshotQueue } from './ScreenshotQueue'
import {
  type NotationPosition,
  type NotationText,
  type ScreenshotTask,
  captureView,
  createExportViewUrl,
  DEFAULT_NOTATION_POSITION,
  DEFAULT_NOTATION_TEXT,
  EXPORT_PADDING,
  NotationPositions,
  NotationTexts,
  resolveScreenshotPath,
} from './takeScreenshot'

/** Args of the image export, shared by `export png` and `export jpg`. */
export type ImageExportArgs = {
  /** The directory where c4 files are located. */
  path: string
  /** Output directory (defaults to workspace when undefined). */
  output: string | undefined
  project: string | undefined
  /** If 'relative' PNG are exported keeping the same directory structure as source files. */
  outputType: 'relative' | 'flat'
  /** If set, use this served url instead of starting a new server. */
  serverUrl?: string | undefined
  theme?: 'light' | 'dark'
  useDotBin: boolean
  timeoutMs?: number
  maxAttempts?: number
  /** Number of views captured in parallel. */
  concurrency?: number
  /** Continue if export fails for some views. */
  ignore?: boolean
  filter?: string[] | undefined
  /** Enable/disable chromium sandbox (see Playwright docs). */
  chromiumSandbox?: boolean
  /** Use sequence layout for dynamic views. */
  sequence?: boolean | undefined
  /** Image format: 'png' or 'jpeg'. Defaults to 'png'. */
  format?: 'png' | 'jpeg'
  /** JPEG quality (1-100). Only used when format is 'jpeg'. Defaults to 80. */
  quality?: number
  /** Include view notation in exported images. */
  notation?: boolean
  /** Corner the notation panel is aligned to. Defaults to 'bottom-right'. */
  notationPosition?: NotationPosition | undefined
  /** How notation entries are labelled. Defaults to 'short'. */
  notationText?: NotationText | undefined
  /** Include view description in exported images. */
  description?: boolean
  /** Absolute path to the file with UI customizations, applied when the server is started by the export. */
  customization?: string | undefined
}

/**
 * Resolves the workspace, graphviz and the file with UI customizations for the image export:
 * flags of the CLI, then the app config.
 *
 * The color scheme of the app config is not used: `--theme` of the export is the scheme of the images.
 */
export async function resolveImageExportConfig(
  args: {
    'app-config'?: string | boolean | undefined
    path?: string | undefined
    'use-dot'?: boolean | undefined
    customization?: string | undefined
  },
  logger: ViteLogger,
): Promise<Pick<ImageExportArgs, 'path' | 'useDotBin' | 'customization'>> {
  const config = await resolveAppConfig({
    appConfig: args['app-config'],
    path: args.path,
    useDot: args['use-dot'],
    customization: args.customization,
  })
  if (config.configFile) {
    logger.info(`${k.cyan('app config')} ${k.dim(relativeToCwd(config.configFile))}`)
  }
  return {
    path: config.workspace,
    useDotBin: config.graphviz === 'binary',
    customization: config.customization,
  }
}

/** Default number of views captured in parallel. */
export const DEFAULT_EXPORT_CONCURRENCY = 4

/**
 * CLI option for the number of views captured in parallel, shared by `export png` and `export jpg`.
 */
export const concurrencyOption = {
  'concurrency': {
    alias: 'j',
    type: 'number',
    desc: 'number of views captured in parallel',
    default: DEFAULT_EXPORT_CONCURRENCY,
    nargs: 1,
  },
} as const

/**
 * CLI options for the notation panel, shared by `export png` and `export jpg`.
 */
export const notationPanelOptions = {
  'notation-position': {
    choices: NotationPositions,
    desc: 'corner of the image to place the notation in (with --notation)',
    default: DEFAULT_NOTATION_POSITION,
    nargs: 1,
  },
  'notation-text': {
    choices: NotationTexts,
    desc:
      'notation labels (with --notation): "short" uses the text before the first ":", "full" the whole text, "kind" the element kinds',
    default: DEFAULT_NOTATION_TEXT,
    nargs: 1,
  },
} as const

/** Options of the screenshot pipeline shared by all projects of one export. */
type ScreenshotPipelineOptions = {
  logger: ViteLogger
  theme: 'light' | 'dark'
  timeoutMs: number
  maxAttempts: number
  concurrency: number
  chromiumSandbox: boolean
  sequence: boolean
  format: 'png' | 'jpeg'
  quality?: number | undefined
  notation: boolean
  notationPosition?: NotationPosition | undefined
  notationText?: NotationText | undefined
  description: boolean
  outputType: 'relative' | 'flat'
}

type ProjectScreenshotTask = ScreenshotTask & {
  projectId: string
  /** Output directory of the project, used to print relative paths. */
  output: string
}

/**
 * One browser and one queue of screenshots for the whole export.
 * Views of all projects are enqueued as soon as they are layouted, workers capture them in parallel.
 */
function createScreenshotPipeline(options: ScreenshotPipelineOptions) {
  const { logger, maxAttempts, concurrency, outputType, format, quality, timeoutMs } = options
  const dynamicVariant = options.sequence ? 'sequence' as const : 'diagram' as const

  const browser = new ScreenshotBrowser({
    logger,
    theme: options.theme,
    timeoutMs,
    chromiumSandbox: options.chromiumSandbox,
  })

  const label = (task: ProjectScreenshotTask) =>
    k.dim(`/project/`) + k.magenta(task.projectId) + k.dim(`/export/`) + task.view.id

  const queue = new ScreenshotQueue<ProjectScreenshotTask, Page>({
    concurrency,
    maxAttempts,
    newPage: () => browser.newPage(),
    closePage: page => browser.discardPage(page),
    run: async (page, task) => {
      await captureView(page, task, { timeout: timeoutMs, dynamicVariant, format, quality })
      logger.info(label(task) + k.dim(` -> ${relative(task.output, task.path)}`))
    },
    onRetry: (task, attempt, delayMs) => {
      logger.info(label(task) + k.dim(` attempt ${attempt} of ${maxAttempts} after ${delayMs}ms`))
    },
    onFailure: (task, error, attempt) => {
      logger.error(k.red(`failed ${label(task)}\n${error}`))
      if (attempt < maxAttempts) {
        logger.info(k.dim(`retry `) + label(task))
      }
    },
  })

  return {
    browser,
    /** Enqueues screenshots of the views; `baseUrl` is the url of the project in the app. */
    enqueue(projectId: string, views: ReadonlyArray<DiagramView>, baseUrl: string, output: string) {
      for (const view of views) {
        if (view.hasLayoutDrift) {
          logger.warn(
            k.yellow('Drift detected, manual layout can not be applied, view may be invalid: ') + k.red(view.id),
          )
        }
        const exportUrl = createExportViewUrl({
          viewId: view.id,
          padding: EXPORT_PADDING,
          theme: options.theme,
          dynamicVariant,
          format,
          notation: options.notation,
          notationPosition: options.notationPosition,
          notationText: options.notationText,
          description: options.description,
        })
        queue.push({
          projectId,
          output,
          view,
          url: new URL(exportUrl, withTrailingSlash(baseUrl)).href,
          path: resolveScreenshotPath({ view, output, outputType, format }),
        })
      }
    },
    /** Waits for all screenshots; rejects if the browser could not be started. */
    drain: () => queue.drain(),
  }
}

/** Run the image export (PNG or JPEG): init workspace, start server if needed, capture views of all projects. */
export async function runExport(args: ImageExportArgs, logger: ViteLogger): Promise<void> {
  const {
    path: workspacePath,
    useDotBin,
    project,
    theme = 'light',
    output: outputArg,
    outputType,
    serverUrl,
    ignore = false,
    timeoutMs = 15_000,
    maxAttempts = 3,
    concurrency = DEFAULT_EXPORT_CONCURRENCY,
    filter,
    sequence = false,
    chromiumSandbox = false,
    format = 'png',
    quality,
    notation = false,
    notationPosition,
    notationText,
    description = false,
    customization,
  } = args

  await using likec4 = await fromWorkspace(workspacePath, {
    graphviz: useDotBin ? 'binary' : 'wasm',
    watch: false,
  })

  const output = outputArg ?? likec4.workspace
  let server: ViteDevServer | undefined
  let resolvedServerUrl = serverUrl

  const projects = [...likec4.languageServices.projects()]
  if (project) {
    if (!projects.some(p => p.id === project)) {
      logger.error(`project not found: ${project}`)
      throw new Error(`project not found: ${project}`)
    }
  }

  const pipeline = createScreenshotPipeline({
    logger,
    theme,
    timeoutMs,
    maxAttempts,
    concurrency,
    chromiumSandbox,
    sequence,
    format,
    quality,
    notation,
    notationPosition,
    notationText,
    description,
    outputType,
  })

  let drained = false
  try {
    if (!resolvedServerUrl) {
      logger.info(k.cyan(`start preview server`))
      // force production mode
      process.env['NODE_ENV'] = 'production'
      server = await viteDev({
        languageServices: likec4,
        buildWebcomponent: false,
        openBrowser: false,
        hmr: false,
        theme,
        customization,
      })
      resolvedServerUrl = resolveServerUrl(server)
      if (!resolvedServerUrl) {
        logger.error('Vite server is not ready, no resolvedUrls')
        throw new Error('Vite server is not ready, no resolvedUrls')
      }
    }

    logger.info(`${k.dim('base url')} ${resolvedServerUrl}`)
    logger.info(`${k.dim('color scheme')} ${theme}`)
    logger.info(`${k.dim('concurrency')} ${concurrency}\n`)

    const startExport = hrtime()
    /** Number of enqueued views per project, in order of projects. */
    const totals = new Map<string, number>()

    for (const prj of projects) {
      if (project && prj.id !== project) {
        continue
      }
      if (projects.length > 1) {
        logger.info(k.dim('---------'))
        logger.info(`${k.dim('project:')} ${k.magenta(prj.id)}`)
        logger.info(`${k.dim('folder:')} ${relativeToCwd(prj.folder.fsPath)}`)
      }
      const model = await likec4.layoutedModel(prj.id)
      let views: DiagramView[] = [...model.views()].map(vm => vm.$layouted)

      if (filter && hasAtLeast(filter, 1) && hasAtLeast(views, 1)) {
        const matcher = picomatch(filter)
        logger.info(`${k.cyan('filter')} ${k.dim(JSON.stringify(filter))}`)
        views = views.filter((v: DiagramView) => {
          if (matcher(v.id)) {
            logger.info(`${k.green('include')} ${v.id} ✅`)
            return true
          }
          logger.info(`${k.gray('skip')} ${k.dim(v.id)}`)
          return false
        })
      }

      if (!hasAtLeast(views, 1)) {
        logger.warn('no views found')
        continue
      }

      const _output = projects.length > 1 ? joinURL(output, prj.id) : output
      logger.info(`${k.dim('output:')} ${relativeToCwd(_output)}`)
      totals.set(prj.id, views.length)
      // Screenshots of this project start while the next project is layouted
      pipeline.enqueue(prj.id, views, joinURL(resolvedServerUrl, 'project', prj.id), _output)
    }

    if (totals.size === 0) {
      return
    }

    drained = true
    const { succeeded } = await pipeline.drain()
    const { pretty } = inMillis(startExport)
    logger.info('')

    const failedProjects = [] as string[]
    for (const [projectId, total] of totals) {
      const ok = succeeded.filter(t => t.projectId === projectId).length
      const prefix = totals.size > 1 ? `${k.dim(projectId)} ` : ''
      if (ok > 0) {
        logger.info(prefix + k.green(`exported ${ok} views`))
      }
      if (ok === total) {
        continue
      }
      const message = `failed ${total - ok} out of ${total} views`
      if (ignore && ok > 0) {
        logger.info(prefix + k.dim('ignore') + ' ' + k.red(message))
      } else {
        logger.error(prefix + k.red(message))
        failedProjects.push(totals.size > 1 ? `${projectId}: ${message}` : message)
      }
    }
    logger.info(k.green(`done in ${pretty}`) + '\n')

    if (failedProjects.length > 0) {
      throw new Error(`Failed ${failedProjects.join(', ')}`)
    }
  } finally {
    // An error before the drain (e.g. layout of a later project):
    // finish the screenshots already enqueued, then rethrow the original error
    if (!drained) {
      await pipeline.drain().catch(e => {
        logger.error(e)
      })
    }
    // Close the browser before the server
    await pipeline.browser.close()
    if (server) {
      logger.debug?.(k.cyan(`stop server`))
      await server.close().catch(e => {
        logger.error(e)
      })
    }
  }
}
