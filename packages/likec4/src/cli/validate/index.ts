import { fromWorkspace } from '@likec4/language-services/node/without-mcp'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import type { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'
import { path } from '../options'

function validateModel(languageServices: LikeC4): boolean {
  const errors = languageServices.getErrors()
  if (errors.length === 0) {
    return true
  }

  return false
}

async function validateLayout(
  path: string,
  languageServices: LikeC4,
  logger: ReturnType<typeof createLikeC4Logger>,
): Promise<boolean> {
  const views = await languageServices.diagrams()
  let hasLayoutDrift = false

  for (const view of views) {
    if (view.drifts && view.drifts.length > 0) {
      hasLayoutDrift = true
      logger.error(
        k.red(`Layout drift detected on view '${view.id}' at ${resolve(path, view.sourcePath ?? '.')}`),
      )
    }
  }

  if (!hasLayoutDrift) {
    return true
  }

  return false
}

const validateCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'validate [path]',
      aliases: [],
      describe: 'Validate model syntax and manual layout',
      builder: yargs =>
        yargs
          .positional('path', path)
          .option('ignore-layout', {
            alias: ['skip-layout'],
            boolean: true,
            default: false,
            description: 'do not validate layout of views',
          }),
      handler: async args => {
        const logger = createLikeC4Logger('c4:validate')
        const ignoreLayout = args['ignore-layout']
        const languageServices = await fromWorkspace(args.path, {
          watch: false,
        })
        let valid = validateModel(languageServices)
        valid = valid && (ignoreLayout || await validateLayout(args.path, languageServices, logger))
      },
    })
}

export default validateCmd
