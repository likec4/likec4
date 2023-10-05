import type { CommandModule } from 'yargs'
import pngCmd from './png'
import k from 'kleur'

export const exportCmd = {
  command: 'export <format> [path]',
  describe: 'Export model to various formats',
  builder: yargs =>
    yargs
      .usage(`${k.bold('Usage:')} $0 export <format>`)
      .command(pngCmd)
      .updateStrings({
        'Commands:': k.bold('Formats:')
      }),
  handler: () => void 0
} satisfies CommandModule

export default exportCmd
