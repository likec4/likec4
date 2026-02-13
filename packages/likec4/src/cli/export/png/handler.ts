import { type DiagramView, type NonEmptyArray, invariant } from '@likec4/core'
import { resolve } from 'node:path'
import { hrtime } from 'node:process'
import picomatch from 'picomatch'
import { hasAtLeast } from 'remeda'
import k from 'tinyrainbow'
import { joinURL, withTrailingSlash } from 'ufo'
import type { ViteDevServer } from 'vite'
import type { Argv } from 'yargs'
import { LikeC4 } from '../../../LikeC4'
import { type ViteLogger, createLikeC4Logger, inMillis } from '../../../logger'
import { resolveServerUrl } from '../../../vite/printServerUrls'
import { viteDev } from '../../../vite/vite-dev'
import { ensureReact } from '../../ensure-react'
import { path, project, useDotBin } from '../../options'
import { takeScreenshot } from './takeScreenshot'

/** CLI args for export png command (single type for handler and runExportPng). */
export type PngExportArgs = {
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
  /** Continue if export fails for some views. */
  ignore?: boolean
  filter?: string[] | undefined
  /** Enable/disable chromium sandbox (see Playwright docs). */
  chromiumSandbox?: boolean
  /** Use sequence layout for dynamic views. */
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

/** Run the PNG export workflow: init workspace, start server if needed, export views (align with drawio/json). */
export async function runExportPng(args: PngExportArgs, logger: ViteLogger): Promise<void> {
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
    filter,
    sequence = false,
    chromiumSandbox = false,
  } = args
  const startTakeScreenshot = hrtime()

  await using likec4 = await LikeC4.fromWorkspace(workspacePath, {
    logger: 'vite',
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

  try {
    if (!resolvedServerUrl) {
      logger.info(k.cyan(`start preview server`))
      server = await viteDev({
        languageServices: likec4,
        buildWebcomponent: false,
        openBrowser: false,
        hmr: false,
      })
      resolvedServerUrl = resolveServerUrl(server)
      if (!resolvedServerUrl) {
        logger.error('Vite server is not ready, no resolvedUrls')
        throw new Error('Vite server is not ready, no resolvedUrls')
      }
    }

    for (const prj of projects) {
      if (project && prj.id !== project) {
        continue
      }
      if (projects.length > 1) {
        logger.info(k.dim('---------'))
        logger.info(`${k.dim('project:')} ${prj.id}`)
        logger.info(`${k.dim('folder:')} ${prj.folder.fsPath}`)
      }
      let views = await likec4.diagrams(prj.id)

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

      const _serverUrl = projects.length > 1
        ? withTrailingSlash(joinURL(resolvedServerUrl, 'project', prj.id))
        : resolvedServerUrl
      const _output = projects.length > 1 ? joinURL(output, prj.id) : output

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
  } finally {
    if (server) {
      logger.info(k.cyan(`stop server`))
      await server.close().catch(e => {
        logger.error(e)
      })
    }
  }
}

/** CLI entry: create logger and delegate to runExportPng (align with drawio/json handlers). */
export async function pngHandler(args: PngExportArgs): Promise<void> {
  const logger = createLikeC4Logger('export')
  await runExportPng(args, logger)
}

export function pngCmd(yargs: Argv) {
  return yargs.command({
    command: 'png [path]',
    describe: 'export views to PNG',
    builder: yargs =>
      yargs
        .positional('path', path)
        .options({
          'outdir': {
            alias: ['o', 'output'],
            type: 'string',
            desc: 'output directory for PNG files; if not specified, images are saved next to sources',
            normalize: true,
            nargs: 1,
            coerce: resolve,
          },
          project,
          'theme': {
            choices: ['light', 'dark'] as const,
            desc: 'color-scheme to use, defaults to light',
            conflicts: ['dark', 'light'],
            nargs: 1,
          },
          'dark': {
            type: 'boolean',
            desc: 'use dark theme, shortcut for --theme=dark',
            conflicts: ['theme', 'light'],
          },
          'light': {
            type: 'boolean',
            desc: 'use light theme, shortcut for --theme=light',
            conflicts: ['theme', 'dark'],
          },
          'use-dot': useDotBin,
          'seq': {
            alias: ['sequence'],
            type: 'boolean',
            desc: 'use sequence layout for dynamic views',
          },
          'flat': {
            alias: ['flatten'],
            type: 'boolean',
            desc: 'flatten all images in outdir ignoring sources structure',
          },
          'filter': {
            alias: 'f',
            array: true,
            string: true,
            desc: 'include views with ids matching given patterns\nmultiple patterns are combined with OR',
          },
          'ignore': {
            boolean: true,
            alias: 'i',
            desc: 'continue if export fails for some views',
          },
          timeout: {
            type: 'number',
            alias: 't',
            desc: 'timeout for playwright (in seconds)',
            default: 15,
            nargs: 1,
          },
          'max-attempts': {
            type: 'number',
            desc: 'max attempts to export failing view, 1 means no retry',
            default: 3,
            nargs: 1,
          },
          'server-url': {
            type: 'string',
            desc: 'use this url instead of starting new likec4 server',
            nargs: 1,
          },
          'chromium-sandbox': {
            boolean: true,
            desc: 'enable chromium sandbox (see Playwright docs)',
            default: false,
          },
        })
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 export png')}
    ${k.gray('Search for likec4 files in current directory and output PNG next to sources')}

  ${k.green('$0 export png --theme dark -o ./png src/likec4')}
    ${k.gray('Search for likec4 files in src/likec4 and output PNG with dark theme to png folder')}

  ${k.green('$0 export png -f "team1*" -f "team2*" --flat -o ./png src/likec4')}
    ${k.gray('Export views matching team1* or team2* only')}

  ${k.green('$0 export png -f "use-case*" --sequence src/likec4')}
    ${k.gray('Export views matching use-case* using sequence layout')}
`),
    handler: async args => {
      invariant(args.timeout >= 1, 'timeout must be >= 1')
      invariant(args['max-attempts'] >= 1, 'max-attempts must be >= 1')
      await ensureReact()
      const theme = args.theme ?? (args.dark ? 'dark' : 'light')
      await pngHandler(
        {
          path: args.path,
          useDotBin: args['use-dot'],
          output: args.outdir,
          project: args.project,
          timeoutMs: args.timeout * 1000,
          maxAttempts: args.maxAttempts,
          ignore: args.ignore === true,
          outputType: args.flat ? 'flat' : 'relative',
          serverUrl: args.serverUrl,
          theme,
          filter: args.filter,
          sequence: args.seq,
          chromiumSandbox: args['chromium-sandbox'],
        } satisfies PngExportArgs,
      )
    },
  })
}
