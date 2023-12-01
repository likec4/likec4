/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative } from 'node:path'
import k from 'picocolors'
import { LanguageServices } from '../../../language-services'
import { createLikeC4Logger, startTimer } from '../../../logger'

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * outfile directory
   */
  outfile: string
}

export async function handler({ path, outfile }: HandlerParams) {
  const logger = createLikeC4Logger('c4:export')

  const timer = startTimer(logger)
  const languageServices = await LanguageServices.get({ path })

  const model = languageServices.getModel()
  if (!model) {
    logger.warn('no model parsed')
    throw new Error('no model parsed')
  }

  if (extname(outfile) !== '.json') {
    outfile = outfile + '.json'
  }
  await mkdir(dirname(outfile), { recursive: true })

  const views = (await languageServices.getViews()).map(v => v.diagram)

  const output = {
    ...model,
    views
  }

  const generatedSource = JSON.stringify(output, null, 2)

  await writeFile(outfile, generatedSource)

  logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)

  timer.stopAndLog(`✓ export in `)
}
