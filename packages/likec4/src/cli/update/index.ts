import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { createLikeC4Logger, startTimer } from '../../logger'
import { exitOnSignals, runInstall } from '../install/handler'
import { path, project } from '../options'

const updateCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'update [name]',
      describe: 'Resolve refs of git dependencies again and install the new commits',
      builder: yargs =>
        yargs
          .positional('name', {
            type: 'string',
            desc: 'dependency to update (key of the "dependencies" section), all if not set',
          })
          .options({
            path: {
              ...path,
              alias: 'workspace',
            },
            project: {
              ...project,
              desc: 'update dependencies of this project only',
            },
          })
          .epilog(`${k.bold('Examples:')}
  ${k.green('$0 update')}
    ${k.gray('Update all git dependencies of the workspace in the current directory')}

  ${k.green('$0 update billing')}
    ${k.gray('Update the dependency "billing" of all projects')}

  ${k.green('$0 update billing --project cloud --path ./architecture')}
    ${k.gray('Update the dependency "billing" of the project "cloud" in ./architecture')}
`),
      handler: async args => {
        const logger = createLikeC4Logger('c4:update')
        const timer = startTimer(logger)
        const { ok } = await exitOnSignals(() =>
          runInstall({
            path: args.path,
            project: args.project,
            name: args.name,
            update: true,
          }, logger)
        )
        if (!ok) {
          process.exitCode = 1
        }
        timer.stopAndLog('update ')
      },
    })
}

export default updateCmd
