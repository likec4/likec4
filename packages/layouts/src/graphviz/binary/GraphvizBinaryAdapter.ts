import { logger } from '@likec4/log'
import spawn, { SubprocessError } from 'nano-spawn'
import os from 'node:os'
import pLimit from 'p-limit'
import { isEmpty } from 'remeda'
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
    this.dotpath = path || which.sync('dot')
    this.unflattenpath = which.sync('unflatten')
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    return await limit(async () => {
      const log = logger.getChild('graphviz-binary')
      let result: string | undefined
      try {
        const unflatten = await spawn(this.unflattenpath, ['-l 1', '-c 3'], {
          timeout: 10_000,
          stdin: {
            string: dot,
          },
        })
        result = unflatten.stdout
        if (!isEmpty(unflatten.stderr)) {
          log.warn`Command ${unflatten.command} has stderr:\n${unflatten.stderr}`
        }
      } catch (error) {
        log.error(`FAILED GraphvizBinaryAdapter.unflatten`, { error })
        if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
          log
            .warn`Command: '${error.command}' returned result but also failed (exitcode ${error.exitCode}): "${error.stderr}"`
          result = error.stdout
        }
      }
      if (result) {
        dot = result.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
      }
      return dot
    })
  }

  async layoutJson(dot: DotSource): Promise<string> {
    return await limit(async () => {
      const log = logger.getChild('graphviz-binary')
      let result: string | undefined
      try {
        const dotcmd = await spawn(this.dotpath, ['-Tjson', '-y'], {
          timeout: 10_000,
          stdin: {
            string: dot,
          },
        })
        result = dotcmd.stdout
        if (!isEmpty(dotcmd.stderr)) {
          log.warn`Command ${dotcmd.command} has stderr:\n${dotcmd.stderr}`
        }
      } catch (error) {
        log.error(`FAILED GraphvizBinaryAdapter.layoutJson`, { error })
        log.warn(`FAILED DOT:\n${dot}`)
        if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
          log.warn(
            `Command: '${error.command}' returned result but also failed (exitcode ${error.exitCode}): "${error.stderr}"`,
          )
          result = error.stdout
        } else {
          throw error
        }
      }
      return result
    })
  }

  async acyclic(_dot: DotSource): Promise<DotSource> {
    return Promise.reject(new Error('Method not implemented.'))
  }

  async svg(dot: DotSource): Promise<string> {
    return await limit(async () => {
      const log = logger.getChild('graphviz-binary')
      let result: string | undefined
      try {
        const dotcmd = await spawn(this.dotpath, ['-Tsvg', '-y'], {
          timeout: 10_000,
          stdin: {
            string: dot,
          },
        })
        result = dotcmd.stdout
        if (!isEmpty(dotcmd.stderr)) {
          log.warn`Command ${dotcmd.command} has stderr:\n${dotcmd.stderr}`
        }
      } catch (error) {
        log.error(`FAILED GraphvizBinaryAdapter.svg`, { error })
        log.warn`FAILED DOT:\n${dot}`
        if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
          log
            .warn`Command: '${error.command}' returned result but also failed (exitcode ${error.exitCode}): "${error.stderr}"`
          result = error.stdout
        } else {
          throw error
        }
      }
      return result
    })
  }
}
