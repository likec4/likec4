import { fromWorkspace } from '@likec4/language-services/node'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { createLikeC4Logger, startTimer } from '../../logger'
import { path, project } from '../options'
import { runValidate } from './handler'
import { parseMaxWarnings } from './result'

const validateCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'validate [path]',
      aliases: [],
      describe: 'Validate syntax, semantics and layout drifts',
      builder: yargs =>
        yargs
          .positional('path', path)
          .options({
            project,
            file: {
              alias: 'f',
              array: true,
              string: true,
              description: 'only report errors from these files (can be specified multiple times)',
            },
            layout: {
              boolean: true,
              default: true,
              defaultDescription: 'enabled',
              description: 'force layout validation, or disable with --no-layout',
            },
            json: {
              boolean: true,
              nargs: 0,
              description: 'output as JSON (structured)',
            },
            'max-warnings': {
              number: true,
              nargs: 1,
              defaultDescription: 'unlimited',
              description: 'fail validation when there are more warnings than this number (0 fails on any warning)',
              coerce: parseMaxWarnings,
            },
          })
          .showHidden()
          .epilog(`${k.bold('Examples:')}          
  ${k.green('$0 validate ')}
    ${k.gray('Validate all in the current directory')}

  ${k.green('$0 validate --no-layout --json -f ./src/model.c4 -f ./src/deployment.c4 ')}
    ${
            k.gray(
              [
                'Validate all',
                'ignore layout drifts',
                'report only errors from these files',
                'output as JSON',
              ].join(', '),
            )
          }

  ${k.green('$0 validate --max-warnings 0')}
    ${k.gray('Validate all, fail on any warning')}

  ${k.green('$0 validate --project my-project /some/where')}
    ${k.gray('Validate my-project in /some/where')}
`),
      handler: async args => {
        const logger = createLikeC4Logger('c4:validate')
        const timer = startTimer(logger)
        const isJson = args.json === true

        // Initialize language services
        await using languageServices = await fromWorkspace(args.path, {
          watch: false,
          printErrors: !isJson,
          throwIfInvalid: false,
          // In JSON mode, redirect logging to stderr to keep stdout clean for JSON
          // In text mode, skip logger reconfiguration to preserve CLI's logger config
          configureLogger: isJson ? 'stderr' : false,
        })

        const result = await runValidate(languageServices, {
          path: args.path,
          project: args.project,
          file: args.file,
          layout: args.layout === true,
          json: isJson,
          maxWarnings: args.maxWarnings,
        }, logger)

        process.exitCode = result.valid ? 0 : 1

        if (!isJson) {
          timer.stopAndLog('validate ')
        }
      },
    })
}

export default validateCmd
