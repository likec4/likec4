import { fromWorkspace } from '@likec4/language-services/node'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { createLikeC4Logger, startTimer } from '../../logger'
import { path, project } from '../options'
import type { DiagnosticItem } from './result'
import { buildValidateResult } from './result'

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

  ${k.green('$0 validate --project my-project /some/where')}
    ${k.gray('Validate my-project in /some/where')}
`),
      handler: async args => {
        const logger = createLikeC4Logger('c4:validate')
        const timer = startTimer(logger)
        const isJson = args.json === true
        const enableLayout = args.layout === true
        const fileFilter = args.file?.map(f => resolve(f)) ?? null

        // Initialize language services
        await using languageServices = await fromWorkspace(args.path, {
          watch: false,
          printErrors: !isJson,
          throwIfInvalid: false,
          // In JSON mode, redirect logging to stderr to keep stdout clean for JSON
          // In text mode, skip logger reconfiguration to preserve CLI's logger config
          configureLogger: isJson ? 'stderr' : false,
        })

        // Collect all model errors
        const allModelErrors: DiagnosticItem[] = languageServices.getErrors().map(e => ({
          message: e.message,
          file: e.sourceFsPath,
          line: e.line,
          range: e.range,
        }))

        // Collect layout drift errors
        const layoutErrors: DiagnosticItem[] = []
        if (enableLayout) {
          logger.debug('running layout validation...')
          try {
            const views = await languageServices.diagrams(args.project)
            for (const view of views) {
              if (view.drifts && view.drifts.length > 0) {
                layoutErrors.push({
                  message: `Layout drift detected on view '${view.id}'`,
                  file: view.sourcePath ? resolve(args.path, view.sourcePath) : '',
                  line: 0,
                  range: null,
                })
              }
            }
          } catch (e) {
            layoutErrors.push({
              message: `Layout validation failed: ${e instanceof Error ? e.message : String(e)}`,
              file: '',
              line: 0,
              range: null,
            })
          }
        }

        const allErrors = [...allModelErrors, ...layoutErrors]

        const result = buildValidateResult({
          documents: languageServices.documentPaths(),
          errors: allErrors,
          fileFilter,
        })
        const { valid, errors: filteredErrors } = result
        const { totalFiles, totalErrors } = result.stats

        process.exitCode = valid ? 0 : 1

        // Output
        if (isJson) {
          console.log(JSON.stringify(result, null, 2))
          return
        }

        // Layout drift errors (model errors already printed by handleInitOptions)
        for (const drift of layoutErrors) {
          logger.error(k.red(drift.message) + (drift.file ? ' at ' + drift.file : ''))
        }

        if (valid) {
          logger.info(k.green(`✓ Valid`) + k.dim(` (${totalFiles} files)`))
        } else {
          const filtered = fileFilter ? `, ${filteredErrors.length} in filtered files` : ''
          logger.error(
            k.red(`✗ Invalid`)
              + k.dim(` (${totalFiles} files, ${totalErrors} errors${filtered})`),
          )
        }
        timer.stopAndLog('validate ')
      },
    })
}

export default validateCmd
