import { viteReactConfig } from '@/vite/config-react'
import { generateReactTypes } from '@likec4/generators'
import { consola } from '@likec4/log'
import { existsSync } from 'node:fs'
import { stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import stripIndent from 'strip-indent'
import k from 'tinyrainbow'
import { build } from 'vite'
import { LikeC4 } from '../../../LikeC4'
import { createLikeC4Logger, startTimer } from '../../../logger'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  outfile: string | undefined
}

export async function reactHandler({ path, useDotBin, outfile }: HandlerParams) {
  const logger = createLikeC4Logger('c4:codegen')
  const timer = startTimer(logger)
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
    graphviz: useDotBin ? 'binary' : 'wasm'
  })

  logger.info(`${k.dim('format')} ${k.green('react')}`)

  const diagrams = await languageServices.diagrams()
  if (diagrams.length === 0) {
    process.exitCode = 1
    throw new Error('no views found')
  }

  diagrams.forEach(view => {
    if (view.hasLayoutDrift) {
      logger.warn(
        k.yellow('drift detected, manual layout can not be applied, view:') + ' ' + k.red(view.id)
      )
    }
  })

  let outfilepath = resolve(languageServices.workspace, 'likec4-views.js')
  if (outfile) {
    outfilepath = isAbsolute(outfile) ? outfile : resolve(outfile)
    if (existsSync(outfile)) {
      const stats = await stat(outfile)
      if (stats.isDirectory()) {
        throw new Error(`output file is a directory: ${outfile}`)
      }
    }
  }
  // logger.info(`${k.dim('outfilepath')} ${outfilepath}`)

  const outDir = dirname(outfilepath)
  logger.info(`${k.dim('outdir')} ${outDir}`)
  const filename = basename(outfilepath)
  logger.info(`${k.dim('filename')} ${filename}`)

  const ext = extname(filename).toLocaleLowerCase()
  if (!['.js', '.mjs', '.jsx'].includes(ext)) {
    logger.error(`output file ${outfile} has extension "${ext}"`)
    throw new Error(`output file ${outfile} must be a .js, .jsx or .mjs`)
  }

  const cfg = await viteReactConfig({
    languageServices,
    outDir,
    filename
  })

  await build({
    ...cfg,
    logLevel: 'warn'
  })

  const model = await languageServices.layoutedModel()

  await writeFile(
    resolve(outDir, basename(outfilepath, ext) + (ext === '.mjs' ? '.d.mts' : '.d.ts')),
    generateReactTypes(model)
  )

  consola.box({
    message: stripIndent(`
    ${k.dim('Source generated:')}
      ${relative(cwd(), outfilepath)}

    ${k.dim('How to use:')}
      ${k.underline('https://likec4.dev/tooling/codegen/#react')}
  `).trim(),
    style: {
      padding: 2,
      borderColor: 'green',
      borderStyle: 'rounded'
    }
  })

  timer.stopAndLog()
}
