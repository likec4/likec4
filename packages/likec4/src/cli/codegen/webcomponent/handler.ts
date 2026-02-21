import { viteWebcomponentConfig } from '#vite/config-webcomponent'
import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, rm, stat } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import { hasAtLeast } from 'remeda'
import stripIndent from 'strip-indent'
import k from 'tinyrainbow'
import { build } from 'vite'
import { boxen, createLikeC4Logger, startTimer } from '../../../logger'
import { mkTempPublicDir } from '../../../vite/utils'
import { ensureReact } from '../../ensure-react'
import { ensureProject } from '../../utils'

type HandlerParams = {
  project: string | undefined
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  webcomponentPrefix: string | undefined
  outfile: string | undefined
}

export async function webcomponentHandler({
  project,
  path,
  useDotBin,
  webcomponentPrefix = 'likec4',
  outfile,
}: HandlerParams) {
  await ensureReact()
  const logger = createLikeC4Logger('c4:codegen')
  const timer = startTimer(logger)
  await using languageServices = await fromWorkspace(path, {
    graphviz: useDotBin ? 'binary' : 'wasm',
    watch: false,
  })
  const { projectId, projectFolder } = ensureProject(languageServices, project)
  if (project) {
    logger.info(`${k.dim('project')} ${k.green(projectId)}`)
  }
  logger.info(`${k.dim('format')} ${k.green('webcomponent')}`)

  const diagrams = await languageServices.diagrams(projectId)
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

  let outfilepath = resolve(
    languageServices.projectsManager.hasMultipleProjects()
      ? projectFolder
      : languageServices.workspace,
    'likec4-views.js',
  )
  if (outfile) {
    outfilepath = isAbsolute(outfile) ? outfile : resolve(outfile)
    if (existsSync(outfile)) {
      const stats = await stat(outfile)
      if (stats.isDirectory()) {
        throw new Error(`output file is a directory: ${outfile}`)
      }
    }
  }
  logger.debug(`${k.dim('outfilepath')} ${outfilepath}`)

  const filename = basename(outfilepath)
  logger.debug(`${k.dim('filename')} ${filename}`)

  const ext = extname(filename).toLocaleLowerCase()
  if (ext !== '.js' && ext !== '.mjs') {
    logger.warn(`output file ${outfile} has extension "${ext}"`)
    throw new Error(`output file ${outfile} must be a .js or .mjs`)
  }

  const publicDir = await mkTempPublicDir()
  logger.debug(`${k.dim('created temp public')} ${publicDir}`)

  const webcomponentConfig = await viteWebcomponentConfig({
    languageServices,
    outDir: publicDir,
    filename: filename,
    webcomponentPrefix,
    base: '/',
  })
  logger.debug(`${k.dim('vite build webcomponent')}`)
  await build({
    ...webcomponentConfig,
    logLevel: 'warn',
  })

  const viteOutputFile = resolve(publicDir, filename)
  if (!existsSync(viteOutputFile)) {
    throw new Error(`output file not found: ${viteOutputFile}`)
  }
  await mkdir(dirname(outfilepath), { recursive: true })

  await copyFile(viteOutputFile, outfilepath)
  logger.info(`${k.dim('generated')} ${outfilepath}`)

  logger.debug(`${k.dim('remove temp public')}`)
  await rm(publicDir, { recursive: true, force: true })

  timer.stopAndLog()

  boxen(
    stripIndent(`
    ${k.dim('Webcomponents generated to:')}
     ${relative(cwd(), outfilepath)}

    ${k.dim('Setup and usage instructions:')}
     ${k.blue('https://likec4.dev/tooling/code-generation/webcomponent/')}
  `),
  )
}
