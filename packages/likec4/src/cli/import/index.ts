import { pipe } from 'remeda'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { drawioCmd } from './drawio/handler'

const importCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'import <format> <input>',
      describe: 'Convert external diagram formats to LikeC4',
      builder: yargs =>
        pipe(
          yargs.usage(`${k.bold('Usage:')} $0 import <format> <input> [options]`),
          drawioCmd,
        ).updateStrings({
          'Commands:': k.bold('Formats:'),
        }),
      handler: () => void 0,
    })
}

export default importCmd
