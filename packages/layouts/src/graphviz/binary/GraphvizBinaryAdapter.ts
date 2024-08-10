import { logger } from '@likec4/log'
import { execa } from 'execa'
import pLimit from 'p-limit'
import type { GraphvizPort } from '../GraphvizLayoter'
import type { DotSource } from '../types'

const limit = pLimit(2)

export class GraphvizBinaryAdapter implements GraphvizPort {
  constructor(
    // Path to the binary, e.g. 'dot' or '/usr/bin/dot'
    public path: string = 'dot'
  ) {
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    return await limit(async () => {
      const unflatten = await execa('unflatten', ['-l 1', '-c 3'], {
        reject: false,
        timeout: 5_000,
        input: dot,
        stdin: 'pipe',
        encoding: 'utf8'
      })
      if (unflatten instanceof Error) {
        if (unflatten.stdout) {
          logger.warn(
            `[BinaryGraphvizLayouter.layout] '${unflatten.command}' failed: ${unflatten.stderr}\n\nbut returned\n${unflatten.stdout}`
          )
        } else {
          logger.error(
            `[BinaryGraphvizLayouter.layout] '${unflatten.command}' failed: ${unflatten.stderr}\n\nnothing returned, ignoring...`
          )
        }
      }

      if (unflatten.stdout) {
        dot = unflatten.stdout.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
      }
      return dot
    })
  }

  async layoutJson(dot: DotSource): Promise<string> {
    return await limit(async () => {
      const dotcmd = await execa(this.path, ['-Tjson', '-y'], {
        reject: false,
        timeout: 5_000,
        input: dot,
        stdin: 'pipe',
        encoding: 'utf8'
      })
      if (dotcmd instanceof Error) {
        if (!dotcmd.stdout) {
          logger.error(
            `[BinaryGraphvizLayouter.layout] '${dotcmd.command}' nothing returned and failed: ${dotcmd.stderr}`
          )
          throw dotcmd
        }
        logger.warn(
          `[BinaryGraphvizLayouter.layout] '${dotcmd.command}' returned result but also failed ${dotcmd.stderr}`
        )
      }
      return dotcmd.stdout
    })
  }

  async acyclic(_dot: DotSource): Promise<DotSource> {
    return Promise.reject(new Error('Method not implemented.'))
  }

  async svg(dot: DotSource): Promise<string> {
    return await limit(async () => {
      const result = await execa(this.path, ['-Tsvg', '-y'], {
        reject: false,
        timeout: 5_000,
        input: dot,
        stdin: 'pipe',
        encoding: 'utf8'
      })

      if (result instanceof Error) {
        if (!result.stdout) {
          logger.error(
            `[BinaryGraphvizLayouter.layout] '${result.command}' nothing returned and failed: ${result.stderr}`
          )
          throw result
        }
        logger.warn(
          `[BinaryGraphvizLayouter.layout] '${result.command}' returned result but also failed ${result.stderr}`
        )
      }
      return result.stdout
    })
  }
}
