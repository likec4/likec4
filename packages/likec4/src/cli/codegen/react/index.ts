import { viteReactConfig } from '@/vite/config-react'
import consola from 'consola'
import { existsSync } from 'node:fs'
import { stat, writeFile } from 'node:fs/promises'
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

  let outfilepath = resolve(languageServices.workspace, 'likec4-views.mjs')
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

  const outDir = dirname(outfilepath)
  consola.debug(`${k.dim('outdir')} ${outDir}`)
  const filename = basename(outfilepath)
  consola.debug(`${k.dim('filename')} ${filename}`)

  const ext = extname(filename).toLocaleLowerCase()
  if (ext !== '.js' && ext !== '.mjs' && ext !== '.jsx') {
    console.warn(`output file ${outfile} has extension "${ext}"`)
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

  const ids = diagrams.map((d) => `  | ${JSON.stringify(d.id)}`).join('\n')

  await writeFile(
    resolve(outDir, basename(outfilepath, ext) + '.d.ts'),
    `
import type { JSX } from 'react'
import type { LikeC4ViewBaseProps } from 'likec4/react'

export type LikeC4ViewId =
${ids}

export declare function isLikeC4ViewId(value: unknown): value is LikeC4ViewId

export type LikeC4ViewProps = LikeC4ViewBaseProps<LikeC4ViewId>

export declare function LikeC4View({viewId, ...props}: LikeC4ViewProps): JSX.Element

`.trimStart()
  )

  consola.box(
    stripIndent(`
    ${k.dim('Component generated:')}
      ${relative(cwd(), outfilepath)}

    ${k.dim('How to use:')}
     ${k.blue('https://likec4.dev/tooling/codegen/#react')}
  `).trim()
  )

  timer.stopAndLog()
}
