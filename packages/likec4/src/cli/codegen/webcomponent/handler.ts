import { viteWebcomponentConfig } from '@/vite/config-webcomponent'
import { mkTempPublicDir } from '@/vite/utils'
import { consola } from '@likec4/log'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, rm, stat } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import { hasAtLeast } from 'remeda'
import stripIndent from 'strip-indent'
import k from 'tinyrainbow'
import { build } from 'vite'
import { LanguageServices } from '../../../language-services'
import { createLikeC4Logger, startTimer } from '../../../logger'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  webcomponentPrefix: string | undefined
  outfile: string | undefined
}

export async function webcomponentHandler({
  path,
  useDotBin,
  webcomponentPrefix = 'likec4',
  outfile
}: HandlerParams) {
  const logger = createLikeC4Logger('c4:codegen')
  const timer = startTimer(logger)
  const languageServices = await LanguageServices.get({ path, useDotBin })

  logger.info(`${k.dim('format')} ${k.green('webcomponent')}`)

  const diagrams = await languageServices.views.diagrams()
  if (!hasAtLeast(diagrams, 1)) {
    logger.warn('no views found')
    process.exitCode = 1
    throw new Error('no views found')
  }

  diagrams.forEach(view => {
    if (view.hasLayoutDrift) {
      logger.warn(k.yellow('drift detected, manual layout can not be applied, view:') + ' ' + k.red(view.id))
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
  consola.debug(`${k.dim('outfilepath')} ${outfilepath}`)

  const filename = basename(outfilepath)
  consola.debug(`${k.dim('filename')} ${filename}`)

  const ext = extname(filename).toLocaleLowerCase()
  if (ext !== '.js' && ext !== '.mjs') {
    consola.warn(`output file ${outfile} has extension "${ext}"`)
    throw new Error(`output file ${outfile} must be a .js or .mjs`)
  }

  const publicDir = await mkTempPublicDir()
  consola.debug(`${k.dim('created temp public')} ${publicDir}`)

  const webcomponentConfig = await viteWebcomponentConfig({
    languageServices,
    outDir: publicDir,
    filename: filename,
    webcomponentPrefix,
    base: '/'
  })
  consola.debug(`${k.dim('vite build webcomponent')}`)
  await build({
    ...webcomponentConfig,
    logLevel: 'warn'
  })

  const viteOutputFile = resolve(publicDir, filename)
  if (!existsSync(viteOutputFile)) {
    throw new Error(`output file not found: ${viteOutputFile}`)
  }
  await mkdir(dirname(outfilepath), { recursive: true })

  await copyFile(viteOutputFile, outfilepath)
  logger.info(`${k.dim('generated')} ${outfilepath}`)

  consola.debug(`${k.dim('remove temp public')}`)
  await rm(publicDir, { recursive: true, force: true })

  consola.box(
    stripIndent(`
    ${k.dim('Webcomponents generated to:')}
     ${relative(cwd(), outfilepath)}

    ${k.dim('Setup and usage instructions:')}
     ${k.blue('https://likec4.dev/tooling/codegen/#webcomponent')}
  `)
  )

  timer.stopAndLog()
}
