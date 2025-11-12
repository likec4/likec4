/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DiagramView, NonEmptyArray } from '@likec4/core'
import { hrtime } from 'node:process'
import picomatch from 'picomatch'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import { joinURL, withTrailingSlash } from 'ufo'
import type { ViteDevServer } from 'vite'
import { LikeC4 } from '../../../LikeC4'
import { type ViteLogger, createLikeC4Logger, inMillis } from '../../../logger'
import { resolveServerUrl } from '../../../vite/printServerUrls'
import { viteDev } from '../../../vite/vite-dev'
import { takeScreenshot } from './takeScreenshot'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * output directory
   */
  output: string | undefined
  project: string | undefined
  /**
   * If 'relative' png are exported keeping the same directory structure as source files.
   */
  outputType: 'relative' | 'flat'
  /**
   * If there is a server already running,
   * use this served url instead of starting a new server.
   */
  serverUrl?: string | undefined
  theme?: 'light' | 'dark'
  useDotBin: boolean
  timeoutMs?: number
  maxAttempts?: number
  ignore?: boolean
  filter?: string[] | undefined
  /**
   * Enable/disable chromium sandbox
   */
  chromiumSandbox?: boolean
  /**
   * Use sequence layout for dynamic views
   */
  sequence?: boolean | undefined
}

export async function exportViewsToPNG(
  {
    logger,
    serverUrl,
    theme = 'light',
    timeoutMs = 15_000,
    views,
    output,
    outputType = 'relative',
    maxAttempts = 3,
    chromiumSandbox = false,
    sequence = false,
  }: {
    logger: ViteLogger
    serverUrl: string
    theme?: 'light' | 'dark'
    timeoutMs?: number
    views: NonEmptyArray<DiagramView>
    output: string
    outputType?: 'relative' | 'flat'
    maxAttempts?: number
    chromiumSandbox?: boolean
    sequence?: boolean
  },
) {
  logger.info(`${k.dim('output')} ${output}`)
  logger.info(`${k.dim('base url')} ${serverUrl}\n`)
  const { chromium } = await import('playwright')
  const chromePath = chromium.executablePath()
  logger.info(k.cyan('Start chromium') + ' ' + k.dim(chromePath))
  const browser = await chromium.launch({
    chromiumSandbox,
    headless: true,
  })
  logger.info(k.cyan(`Color scheme: `) + theme + '\n')
  const browserContext = await browser.newContext({
    deviceScaleFactor: 2,
    colorScheme: theme,
    baseURL: serverUrl,
    bypassCSP: true,
    ignoreHTTPSErrors: true,
    isMobile: false,
  })
  browserContext.setDefaultNavigationTimeout(timeoutMs)
  browserContext.setDefaultTimeout(timeoutMs)
  try {
    return await takeScreenshot({
      browserContext,
      views,
      output,
      outputType,
      logger,
      maxAttempts,
      dynamicVariant: sequence ? 'sequence' : 'diagram',
      timeout: timeoutMs,
      theme,
    })
  } finally {
    logger.info(k.cyan(`close chromium`))
    await browserContext.close()
    await browser.close()
  }
}

export async function pngHandler({
  path,
  useDotBin,
  project,
  theme = 'light',
  output,
  outputType,
  serverUrl,
  ignore = false,
  timeoutMs = 10_000,
  maxAttempts = 3,
  filter,
  sequence = false,
  chromiumSandbox = false,
}: HandlerParams) {
  const logger = createLikeC4Logger('export')
  const startTakeScreenshot = hrtime()

  await using languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
    graphviz: useDotBin ? 'binary' : 'wasm',
    watch: false,
  })

  output ??= languageServices.workspace
  let server: ViteDevServer | undefined

  let projects = [...languageServices.languageServices.projects()]
  if (project) {
    if (!projects.some(p => p.id === project)) {
      logger.error(`project not found: ${project}`)
      throw new Error(`project not found: ${project}`)
    }
  }

  if (!serverUrl) {
    logger.info(k.cyan(`start preview server`))
    server = await viteDev({
      languageServices,
      buildWebcomponent: false,
      openBrowser: false,
      useOverviewGraph: false,
      hmr: false,
    })
    serverUrl = resolveServerUrl(server)
    if (!serverUrl) {
      logger.error('Vite server is not ready, no resolvedUrls')
      throw new Error('Vite server is not ready, no resolvedUrls')
    }
  }

  for (const prj of projects) {
    // skip other projects if project arg specified
    if (project && prj.id !== project) {
      continue
    }
    if (projects.length > 1) {
      logger.info(k.dim('---------'))
      logger.info(`${k.dim('project:')} ${prj.id}`)
      logger.info(`${k.dim('folder:')} ${prj.folder.fsPath}`)
    }
    let views = await languageServices.diagrams(prj.id)

    if (filter && hasAtLeast(filter, 1) && hasAtLeast(views, 1)) {
      const matcher = picomatch(filter)
      logger.info(`${k.cyan('filter')} ${k.dim(JSON.stringify(filter))}`)
      views = views.filter(v => {
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

    let _serverUrl = projects.length > 1 ? withTrailingSlash(joinURL(serverUrl, 'project', prj.id)) : serverUrl
    let _output = projects.length > 1 ? joinURL(output, prj.id) : output

    const succeed = await exportViewsToPNG({
      logger,
      serverUrl: _serverUrl,
      theme,
      timeoutMs,
      views,
      output: _output,
      outputType,
      maxAttempts,
      sequence,
      chromiumSandbox,
    })
    const { pretty } = inMillis(startTakeScreenshot)

    if (succeed.length > 0) {
      logger.info(k.green(`exported ${succeed.length} views in ${pretty}`) + '\n')
    }
    if (succeed.length !== views.length) {
      if (ignore && succeed.length > 0) {
        logger.info(
          k.dim('ignore') + ' ' + k.red(`failed ${views.length - succeed.length} out of ${views.length} views`),
        )
      } else {
        logger.error(k.red(`failed ${views.length - succeed.length} out of ${views.length} views`))
      }
    }

    if (succeed.length !== views.length && (succeed.length === 0 || !ignore)) {
      throw new Error(`Failed ${views.length - succeed.length} out of ${views.length} views`)
    }
  }

  if (server) {
    logger.info(k.cyan(`stop server`))
    await server.close().catch(e => {
      logger.error(e)
    })
  }
}
