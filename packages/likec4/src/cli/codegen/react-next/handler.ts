import { mkdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { cwd } from 'node:process'
import k from 'tinyrainbow'
import { LikeC4 } from '../../../LikeC4'
import { createLikeC4Logger, startTimer } from '../../../logger'
import { writeSources } from './write-sources'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  useDotBin: boolean
  outdir: string | undefined
}

export async function reactNexthandler({ path, useDotBin, outdir }: HandlerParams) {
  const logger = createLikeC4Logger('c4:codegen')
  const timer = startTimer()
  const languageServices = await LikeC4.initForWorkspace(path, {
    logger: 'vite',
    graphviz: useDotBin ? 'binary' : 'wasm'
  })

  logger.info(`${k.dim('format')} ${k.green('react-next')}`)

  const diagrams = await languageServices.views.diagrams()
  if (diagrams.length === 0) {
    logger.warn('no views found')
    process.exitCode = 1
    throw new Error('no views found')
  }

  const outputDir = outdir ?? resolve(languageServices.workspace, 'likec4-views')
  await mkdir(outputDir, { recursive: true })

  logger.info(`${k.dim('output to:')} ${relative(cwd(), outputDir)}`)

  await writeSources({ outputDir, diagrams })

  timer.stopAndLog()
}
