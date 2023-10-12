import { nonexhaustive } from '@likec4/core'
import { generateD2, generateMermaid, generateReact, generateViewsDataTs } from '@likec4/generators'
import { printToDot } from '@likec4/layouts'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import k from 'picocolors'
import type { Logger } from 'vite'
import { LanguageServicesInstance, type LanguageServices } from '../../language-services'
import { createLikeC4Logger, startTimer } from '../../logger'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
} & (
  | {
      format: 'react' | 'views'
      outfile: string | undefined
    }
  | {
      format: 'dot' | 'd2' | 'mermaid'
      outdir: string | undefined
    }
)

async function singleFileCodegenAction(
  languageServices: LanguageServices,
  format: 'react' | 'views',
  outfile: string | undefined,
  logger: Logger
) {
  const expectedExt = format === 'react' ? '.tsx' : '.ts'
  outfile = outfile ?? resolve(languageServices.workspace, 'likec4.generated' + expectedExt)
  if (extname(outfile) !== expectedExt) {
    outfile = outfile + expectedExt
  }
  await mkdir(dirname(outfile), { recursive: true })

  const views = await languageServices.getViews()
  const generator = format === 'react' ? generateReact : generateViewsDataTs

  const generatedSource = generator(views)

  await writeFile(outfile, generatedSource)

  logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)
}

async function multipleFilesCodegenAction(
  languageServices: LanguageServices,
  format: 'dot' | 'd2' | 'mermaid',
  outdir: string,
  logger: Logger
) {
  await mkdir(outdir, { recursive: true })

  logger.info(`${k.dim('format')} ${k.green(format)}`)
  logger.info(`${k.dim('outdir')} ${outdir}`)

  let ext
  let generator
  switch (format) {
    case 'dot':
      ext = '.dot'
      generator = printToDot
      break
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
  const views = await languageServices.getViews()
  let succeeded = 0
  for (const view of views) {
    try {
      const relativePath = view.relativePath ?? ''
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

export async function handler({ path, ...outparams }: HandlerParams) {
  const logger = createLikeC4Logger('c4:codegen')
  const timer = startTimer(logger)
  const languageServices = await LanguageServicesInstance.get({
    workspaceDir: path
  })

  const views = await languageServices.getViews()
  if (views.length === 0) {
    logger.warn('no views found')
    process.exit(0)
  }

  switch (outparams.format) {
    case 'react':
    case 'views': {
      await singleFileCodegenAction(languageServices, outparams.format, outparams.outfile, logger)
      break
    }
    case 'dot':
    case 'd2':
    case 'mermaid': {
      await multipleFilesCodegenAction(
        languageServices,
        outparams.format,
        outparams.outdir ?? path,
        logger
      )
      break
    }
    default:
      nonexhaustive(outparams)
  }
  timer.stopAndLog()
}
