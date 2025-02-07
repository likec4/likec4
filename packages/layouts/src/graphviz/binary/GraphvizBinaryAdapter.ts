import { logger } from '@likec4/log'
import { execa, ExecaError } from 'execa'
import os from 'node:os'
import pLimit from 'p-limit'
import which from 'which'
import type { GraphvizPort } from '../GraphvizLayoter'
import type { DotSource } from '../types'

const limit = pLimit(Math.max(1, os.cpus().length))

export class GraphvizBinaryAdapter implements GraphvizPort {
  private dotpath: string
  private unflattenpath: string

  constructor(
    // Path to the binary, e.g. 'dot' or '/usr/bin/dot'
    path?: string,
  ) {
    // const dotpath =
    // if (!dotpath) {
    //   throw new Error('Graphviz binary not found')
    // }
    this.dotpath = path || which.sync('dot')
    this.unflattenpath = which.sync('unflatten')
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    return await limit(async () => {
      const log = logger.withTag('graphviz-binary')
      const unflatten = await execa(this.unflattenpath, ['-l 1', '-c 3'], {
        reject: false,
        timeout: 10_000,
        input: dot,
        detached: true,
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
      })
      if (unflatten.failed) {
        if (unflatten.stdout) {
          log.warn(
            `Command: '${unflatten.command}' failed: ${unflatten.stderr}\n\nbut returned\n${unflatten.stdout}`,
          )
        } else {
          log.error(unflatten)
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
      const log = logger.withTag('graphviz-binary')
      const dotcmd = await execa(this.dotpath, ['-Tjson', '-y'], {
        reject: false,
        timeout: 10_000,
        input: dot,
        detached: true,
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
      })
      if (dotcmd.failed) {
        if (!dotcmd.stdout) {
          log.error(
            `Command: '${dotcmd.command}' nothing returned and failed (exitcode ${dotcmd.exitCode}): "${dotcmd.stderr}"`,
          )
          log.error(dotcmd)
          log.warn(`FAILED DOT:\n${dot}`)
          throw dotcmd
        }
        log.warn(
          `Command: '${dotcmd.command}' returned result but also failed (exitcode ${dotcmd.exitCode}): "${dotcmd.stderr}"`,
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
      const log = logger.withTag('graphviz-binary')
      const result = await execa(this.dotpath, ['-Tsvg', '-y'], {
        reject: false,
        timeout: 10_000,
        input: dot,
        detached: true,
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
      })

      if (result.failed) {
        log.warn(`DOT:\n${dot}`)
        if (!result.stdout) {
          log.error(
            `Command: '${result.command}' nothing returned and failed: ${result.stderr}`,
          )
          throw result
        }
        log.warn(
          `Command: '${result.command}' returned result but also failed ${result.stderr}`,
        )
      }
      return result.stdout
    })
  }
}
