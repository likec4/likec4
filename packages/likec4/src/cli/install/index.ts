import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { createLikeC4Logger, startTimer } from '../../logger'
import { path, project } from '../options'
import { exitOnSignals, runInstall } from './handler'

const installCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'install [path]',
      aliases: ['i'],
      describe: 'Install git dependencies of the workspace into the cache',
      builder: yargs =>
        yargs
          .positional('path', path)
          .options({
            project: {
              ...project,
              desc: 'install dependencies of this project only',
            },
          })
          .epilog(`${k.bold('Examples:')}
  ${k.green('$0 install')}
    ${k.gray('Install git dependencies of all projects in the current directory')}

  ${k.green('$0 install --project cloud')}
    ${k.gray('Install git dependencies of the project "cloud"')}

${k.bold('Notes:')}
  Refs already resolved in the cache keep their commit, use ${k.green('$0 update')} to resolve them again.
  The cache directory is set by the ${k.bold('LIKEC4_CACHE_DIR')} environment variable.
`),
      handler: async args => {
        const logger = createLikeC4Logger('c4:install')
        const timer = startTimer(logger)
        const { ok } = await exitOnSignals(() =>
          runInstall({
            path: args.path,
            project: args.project,
            update: false,
          }, logger)
        )
        if (!ok) {
          process.exitCode = 1
        }
        timer.stopAndLog('install ')
      },
    })
}

export default installCmd
