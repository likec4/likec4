import { invariant, nonexhaustive } from '@likec4/core'
import { generateD2, generateMermaid, generateViewsDataTs } from '@likec4/generators'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Logger } from 'vite'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger, logger as cliLogger, startTimer } from '../../logger'

type HandlerParams =
  & {
    /**
     * The directory where c4 files are located.
     */
    path: string
    useDotBin: boolean
  }
  & (
    | {
      format: 'views'
      outfile: string | undefined
    }
    | {
      format: 'dot' | 'd2' | 'mermaid'
      outdir: string | undefined
    }
  )

async function singleFileCodegenAction(
  languageServices: LikeC4,
  outfile: string | undefined,
  logger: Logger,
) {
  const expectedExt = '.ts'
  outfile = outfile ?? resolve(languageServices.workspace, 'likec4.generated' + expectedExt)
  if (extname(outfile) !== expectedExt) {
    outfile = outfile + expectedExt
  }
  await mkdir(dirname(outfile), { recursive: true })

  const views = await languageServices.diagrams()

  const generatedSource = generateViewsDataTs([...views])

  await writeFile(outfile, generatedSource)

  logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)
}

async function dotCodegenAction(
  languageServices: LikeC4,
  outdir: string,
  logger: Logger,
) {
  await mkdir(outdir, { recursive: true })

  logger.info(`${k.dim('format')} ${k.green('dot')}`)
  logger.info(`${k.dim('outdir')} ${outdir}`)

  const createdDirs = new Set<string>()
  const views = await languageServices.viewsService.computedViews()
  let succeeded = 0
  for (const view of views) {
    try {
      const dot = await languageServices.viewsService.layouter.dot(view)
      const relativePath = view.relativePath ?? ''
      if (relativePath !== '' && !createdDirs.has(relativePath)) {
        await mkdir(resolve(outdir, relativePath), { recursive: true })
        createdDirs.add(relativePath)
      }
      const outfile = resolve(outdir, relativePath, view.id + '.dot')
      await writeFile(outfile, dot)
      logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)
      succeeded++
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cliLogger.error(`error while generating ${view.id}`, { error })
    }
  }
  if (succeeded > 0) {
    logger.info(`${k.dim('total')} ${succeeded} files`)
  }
}

async function multipleFilesCodegenAction(
  languageServices: LikeC4,
  format: 'd2' | 'mermaid',
  outdir: string,
  logger: Logger,
) {
  await mkdir(outdir, { recursive: true })

  logger.info(`${k.dim('format')} ${k.green(format)}`)
  logger.info(`${k.dim('outdir')} ${outdir}`)

  let ext
  let generator
  switch (format) {
    case 'd2':
      ext = '.d2'
      generator = generateD2
      break
    case 'mermaid':
      ext = '.mmd'
      generator = generateMermaid
      break
    default:
      nonexhaustive(format)
  }

  const createdDirs = new Set<string>()
  const views = await languageServices.diagrams()
  let succeeded = 0
  for (const view of views) {
    try {
      let relativePath = view.relativePath ?? '.'
      if (relativePath.includes('/')) {
        relativePath = relativePath.slice(0, relativePath.lastIndexOf('/'))
      } else {
        relativePath = '.'
      }
      if (relativePath !== '' && !createdDirs.has(relativePath)) {
        await mkdir(resolve(outdir, relativePath), { recursive: true })
        createdDirs.add(relativePath)
      }
      const outfile = resolve(outdir, relativePath, view.id + ext)
      const generatedSource = generator(view)
      await writeFile(outfile, generatedSource)
      logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)
      succeeded++
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger.error(`error while generating ${view.id}`, { error: error as any })
    }
  }
  if (succeeded > 0) {
    logger.info(`${k.dim('total')} ${succeeded} files`)
  }
}

export async function legacyHandler({ path, useDotBin, ...outparams }: HandlerParams) {
  const logger = createLikeC4Logger('c4:codegen')
  const timer = startTimer(logger)
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
    graphviz: useDotBin ? 'binary' : 'wasm',
  })

  const views = await languageServices.viewsService.computedViews()
  if (views.length === 0) {
    logger.warn('no views found')
    process.exitCode = 1
    throw new Error('no views found')
  }

  switch (outparams.format) {
    case 'views': {
      await singleFileCodegenAction(languageServices, outparams.outfile, logger)
      break
    }
    case 'dot': {
      await dotCodegenAction(languageServices, outparams.outdir ?? path, logger)
      break
    }
    case 'd2':
    case 'mermaid': {
      await multipleFilesCodegenAction(
        languageServices,
        outparams.format,
        outparams.outdir ?? path,
        logger,
      )
      break
    }
    default:
      nonexhaustive(outparams)
  }
  timer.stopAndLog()
}
