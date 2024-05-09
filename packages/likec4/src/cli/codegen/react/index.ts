import { viteReactConfig } from '@/vite/config-react'
import consola from 'consola'
import { existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import k from 'picocolors'
import stripIndent from 'strip-indent'
import { build } from 'vite'
import { LanguageServices } from '../../../language-services'
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
  const timer = startTimer()
  const languageServices = await LanguageServices.get({ path, useDotBin })

  logger.info(`${k.dim('format')} ${k.green('react')}`)

  const diagrams = await languageServices.views.diagrams()
  if (diagrams.length === 0) {
    logger.warn('no views found')
    process.exitCode = 1
    throw new Error('no views found')
  }

  let outfilepath = resolve(languageServices.workspace, 'likec4-react.mjs')
  if (outfile) {
    outfilepath = isAbsolute(outfile) ? outfile : resolve(outfile)
    if (existsSync(outfile)) {
      const stats = await stat(outfile)
      if (stats.isDirectory()) {
        throw new Error(`output file is a directory: ${outfile}`)
      }
    }
  }
  consola.debug(`${k.dim('outfilepath')} ${outfilepath}`)

  const filename = basename(outfilepath)
  consola.debug(`${k.dim('filename')} ${filename}`)

  const ext = extname(filename).toLowerCase()
  if (ext !== '.js' && ext !== '.mjs') {
    throw new Error(`output file must be a .js or .mjs file: ${outfile}`)
  }

  const cfg = await viteReactConfig({
    languageServices,
    outDir: dirname(outfilepath),
    filename
  })

  await build({
    ...cfg,
    logLevel: 'warn'
  })

  consola.box(
    stripIndent(`
    ${k.dim('React component generated:')}
      ${relative(cwd(), outfilepath)}

    ${k.dim('How to use:')}
     ${k.blue('https://likec4.dev/docs/tooling/react')}
  `).trim()
  )

  timer.stopAndLog()
}
