import { generateLikeC4Model } from '@likec4/generators'
import { existsSync } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import stripIndent from 'strip-indent'
import k from 'tinyrainbow'
import { LikeC4 } from '../../../LikeC4'
import { boxen, createLikeC4Logger, startTimer } from '../../../logger'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  outfile: string | undefined
}

export async function modelHandler({ path, useDotBin, outfile }: HandlerParams) {
  const logger = createLikeC4Logger('c4:codegen')
  const timer = startTimer(logger)
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
    graphviz: useDotBin ? 'binary' : 'wasm',
  })

  logger.info(`${k.dim('format')} ${k.green('model')}`)

  const model = await languageServices.layoutedModel()

  for (const view of model.views()) {
    if (view.$view.hasLayoutDrift) {
      logger.warn(
        k.yellow('drift detected, manual layout can not be applied, view:') + ' ' + k.red(view.id),
      )
    }
  }

  let outfilepath = resolve(languageServices.workspace, 'likec4-model.ts')
  if (outfile) {
    outfilepath = isAbsolute(outfile) ? outfile : resolve(outfile)
    if (existsSync(outfile)) {
      const stats = await stat(outfile)
      if (stats.isDirectory()) {
        throw new Error(`output file is a directory: ${outfile}`)
      }
    }
  }
  // logger.info(`${k.dim('outfile')} ${outfilepath}`)
  const filename = basename(outfilepath)
  logger.info(`${k.dim('filename')} ${filename}`)

  const ext = extname(filename).toLocaleLowerCase()
  if (!['.ts', '.mts', '.cts'].includes(ext)) {
    logger.error(`output file ${outfile} has extension "${ext}"`)
    throw new Error(`output file ${outfile} must be a .ts, .mts or .cts file`)
  }
  const outDir = dirname(outfilepath)
  logger.info(`${k.dim('outdir')} ${outDir}`)

  await mkdir(outDir, { recursive: true })

  await writeFile(outfilepath, generateLikeC4Model(model), {
    encoding: 'utf-8',
  })

  boxen(
    stripIndent(`
    ${k.dim('Source with LikeC4Model generated:')}
      ${relative(cwd(), outfilepath)}

    ${k.dim('How to use:')}
      ${k.underline('https://likec4.dev/tooling/code-generation/model/')}
  `).trim(),
    {
      padding: 2,
      borderColor: 'green',
      borderStyle: 'round',
    },
  )

  timer.stopAndLog()
}
