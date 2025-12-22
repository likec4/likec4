import { pipe } from 'remeda'
import k from 'tinyrainbow'
import type * as yargs from 'yargs'
import { jsonCmd } from './json/handler'
import { pngCmd } from './png/handler'

const exportCmd = (yargs: yargs.Argv) => {
  return yargs
    .command({
      command: 'export <format> [path]',
      describe: 'Export to images or JSON',
      builder: yargs =>
        pipe(
          yargs.usage(`${k.bold('Usage:')} $0 export <format> [path]`),
          pngCmd,
          jsonCmd,
        )
          .updateStrings({
            'Commands:': k.bold('Formats:'),
          }),
      handler: () => void 0,
    })
}

export default exportCmd
