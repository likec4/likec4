import { nonexhaustive } from '@likec4/core'
import { generateD2, generateMermaid, generatePuml, generateViewsDataTs } from '@likec4/generators'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { values } from 'remeda'
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
      format: 'dot' | 'd2' | 'mermaid' | 'plantuml'
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
  const model = languageServices.computedModel()
  const views = values(model.$data.views)
  let succeeded = 0
  for (const view of views) {
    try {
      const dot = await languageServices.viewsService.layouter.dot({
        view,
        styles: model.$styles,
      })
      let relativePath = '.'
      if (view.sourcePath) {
        relativePath = dirname(view.sourcePath)
      }
      relativePath = resolve(outdir, relativePath)

      if (!createdDirs.has(relativePath)) {
        await mkdir(relativePath, { recursive: true })
        createdDirs.add(relativePath)
      }
      const outfile = resolve(relativePath, view.id + '.dot')

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
  format: 'd2' | 'mermaid' | 'plantuml',
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
    case 'plantuml':
      ext = '.puml'
      generator = generatePuml
      break
    default:
      nonexhaustive(format)
  }

  const createdDirs = new Set<string>()
  const model = await languageServices.layoutedModel()
  let succeeded = 0
  for (const vm of model.views()) {
    const view = vm.$view
    try {
      let relativePath = '.'
      if (view.sourcePath) {
        relativePath = dirname(view.sourcePath)
      }
      relativePath = resolve(outdir, relativePath)

      if (!createdDirs.has(relativePath)) {
        await mkdir(relativePath, { recursive: true })
        createdDirs.add(relativePath)
      }

      const outfile = resolve(relativePath, view.id + ext)
      const generatedSource = generator(vm)
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
  languageServices.ensureSingleProject()

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
    case 'mermaid':
    case 'plantuml': {
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
