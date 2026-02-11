import { parseDrawioToLikeC4 } from '@likec4/generators'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import k from 'tinyrainbow'
import type { Argv } from 'yargs'
import { createLikeC4Logger, startTimer } from '../../../logger'

export function drawioCmd(yargs: Argv) {
  return yargs.command({
    command: 'drawio <input>',
    describe: 'convert DrawIO (.drawio) to LikeC4 source (.c4)',
    builder: yargs =>
      yargs
        .positional('input', {
          type: 'string',
          describe: 'path to .drawio or .drawio.xml file',
          normalize: true,
          coerce: resolve,
        })
        .option('outfile', {
          alias: 'o',
          type: 'string',
          desc: '<file> output .c4 file (default: same name as input with .c4)',
          normalize: true,
          coerce: resolve,
        })
        .epilog(`${k.bold('Examples:')}
  ${k.green('$0 import drawio diagram.drawio')}
    ${k.gray('Convert diagram.drawio to diagram.c4')}

  ${k.green('$0 import drawio diagram.drawio -o src/model.c4')}
    ${k.gray('Convert and write to src/model.c4')}
`),
    handler: async args => {
      const logger = createLikeC4Logger('c4:import')
      const timer = startTimer(logger)

      const inputPath = args.input
      if (!inputPath) {
        throw new Error('Missing required argument: input')
      }
      const xml = await readFile(inputPath, 'utf-8')
      const likec4Source = parseDrawioToLikeC4(xml)

      let outfile = args.outfile
      if (!outfile) {
        const base = inputPath.replace(/\.drawio(\.xml)?$/i, '')
        outfile = base + '.c4'
      } else if (extname(outfile) !== '.c4') {
        outfile = outfile + '.c4'
      }

      await writeFile(outfile, likec4Source)

      logger.info(`${k.dim('generated')} ${relative(process.cwd(), outfile)}`)
      timer.stopAndLog(`✓ import drawio in `)
    },
  })
}
