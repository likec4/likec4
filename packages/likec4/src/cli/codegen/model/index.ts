import { generateLikeC4Model } from '@likec4/generators'
import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { existsSync } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import stripIndent from 'strip-indent'
import k from 'tinyrainbow'
import { boxen, createLikeC4Logger, startTimer } from '../../../logger'
import { ensureProject } from '../../utils'

type HandlerParams = {
  project: string | undefined
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * Whether to use `@likec4/core` package in types
   * @default false
   */
  useCorePackage: boolean
  useDotBin: boolean
  outfile: string | undefined
}

export async function modelHandler({ path, useDotBin, useCorePackage, outfile, project }: HandlerParams) {
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

  logger.info(`${k.dim('format')} ${k.green('model')}`)

  const model = await languageServices.layoutedModel(projectId)

  for (const view of model.views()) {
    if (view.hasLayoutDrifts) {
      logger.warn(
        k.yellow('layout drift detected, view:') + ' ' + k.red(view.id),
      )
    }
  }

  let outfilepath = resolve(
    languageServices.projectsManager.hasMultipleProjects()
      ? projectFolder
      : languageServices.workspace,
    'likec4-model.ts',
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

  await writeFile(outfilepath, generateLikeC4Model(model, { useCorePackage }), {
    encoding: 'utf-8',
  })

  timer.stopAndLog()

  boxen(
    stripIndent(`
    ${k.dim('Source generated:')}
      ${relative(cwd(), outfilepath)}

    ${k.dim('How to use:')}
      ${k.underline('https://likec4.dev/tooling/code-generation/model/')}
  `).trim(),
    {
      padding: 1,
      borderColor: 'green',
      borderStyle: 'round',
    },
  )
}
