import { viteReactConfig } from '#vite/config-react'
import { generateReactTypes } from '@likec4/generators'
import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { existsSync } from 'node:fs'
import { stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import stripIndent from 'strip-indent'
import k from 'tinyrainbow'
import { build } from 'vite'
import { boxen, createLikeC4Logger, startTimer } from '../../../logger'
import { ensureReact } from '../../ensure-react'
import { ensureProject } from '../../utils'

type HandlerParams = {
  project: string | undefined
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  /**
   * Whether to use `@likec4/core` package in types
   * @default false
   */
  useCorePackage: boolean
  outfile: string | undefined
}

export async function reactHandler({ path, useDotBin, useCorePackage, outfile, project }: HandlerParams) {
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
  logger.info(`${k.dim('format')} ${k.green('react')}`)

  const diagrams = await languageServices.diagrams(projectId)
  if (diagrams.length === 0) {
    process.exitCode = 1
    throw new Error('no views found')
  }

  diagrams.forEach(view => {
    if (view.drifts && view.drifts.length > 0) {
      logger.info(
        k.yellow('layout drift detected, view:') + ' ' + k.red(view.id),
      )
      return
    }
    if (view.hasLayoutDrift) {
      logger.warn(
        k.yellow('drift detected, manual layout can not be applied, view:') + ' ' + k.red(view.id),
      )
      return
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
    filename,
  })

  await build({
    ...cfg,
    logLevel: 'warn',
  })

  const model = await languageServices.layoutedModel(projectId)

  const dts = resolve(outDir, basename(outfilepath, ext) + (ext === '.mjs' ? '.d.mts' : '.d.ts'))
  await writeFile(dts, generateReactTypes(model, { useCorePackage }))

  timer.stopAndLog()

  boxen(
    stripIndent(`
    ${k.dim('Sources generated:')}
      ${relative(cwd(), outfilepath)}
      ${relative(cwd(), dts)}

    ${k.dim('How to use:')}
      ${k.underline('https://likec4.dev/tooling/code-generation/react/')}
  `),
    {
      padding: 1,
      borderColor: 'green',
      borderStyle: 'round',
    },
  )
}
