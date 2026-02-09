import type * as yargs from 'yargs'
import { path } from '../options'
import { checkHandler } from './check'
import { publishHandler } from './publish'
import { syncHandler } from './sync'

const federationCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'federation <command>',
      describe: 'Manage federation manifests and registry',
      builder: yargs =>
        yargs
          .command({
            command: 'publish [path]',
            describe: 'Build and publish a federation manifest to the registry',
            builder: yargs =>
              yargs
                .positional('path', path),
            handler: async args => {
              await publishHandler({ path: args.path })
            },
          })
          .command({
            command: 'check [path]',
            describe: 'Check if publishing would break any consumers (dry-run)',
            builder: yargs =>
              yargs
                .positional('path', path),
            handler: async args => {
              await checkHandler({ path: args.path })
            },
          })
          .command({
            command: 'sync [path]',
            describe: 'Sync consumer import contracts to the registry',
            builder: yargs =>
              yargs
                .positional('path', path),
            handler: async args => {
              await syncHandler({ path: args.path })
            },
          })
          .demandCommand(1, 'Please specify a federation subcommand'),
      handler: () => {
        // This handler is required by yargs but won't be called due to demandCommand
      },
    })
}

export default federationCmd
