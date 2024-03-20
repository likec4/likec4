import k from 'picocolors'
import type { CommandModule } from 'yargs'
import jsonCmd from './json'
import pngCmd from './png'

export const exportCmd = {
  command: 'export <format> [path]',
  describe: 'Export model to various formats',
  builder: yargs =>
    yargs
      .usage(`${k.bold('Usage:')} $0 export <format>`)
      .command(pngCmd)
      .command(jsonCmd)
      .updateStrings({
        'Commands:': k.bold('Formats:')
      }),
  handler: () => void 0
} satisfies CommandModule

export default exportCmd
