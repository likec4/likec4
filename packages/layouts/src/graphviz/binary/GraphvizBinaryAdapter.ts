import { memoizeProp } from '@likec4/core/utils'
import { rootLogger } from '@likec4/log'
import spawn, { SubprocessError } from 'nano-spawn'
import os from 'node:os'
import { isEmpty } from 'remeda'
import which from 'which'
import type { GraphvizPort } from '../GraphvizLayoter'
import type { DotSource } from '../types'

const logger = rootLogger.getChild('graphviz-binary')

export class GraphvizBinaryAdapter implements GraphvizPort {
  private _dotpath: string | undefined
  private _unflattenpath: string | undefined

  constructor(
    /**
     * Path to the binary, e.g. 'dot' or '/usr/bin/dot'
     * If not provided, will be found using `which`.
     */
    dot_path?: string,
    /**
     * Path to the binary, e.g. 'unflatten' or '/usr/bin/unflatten'
     * If not provided, will be found using `which`.
     */
    unflatten_path?: string,
  ) {
    this._dotpath = dot_path
    this._unflattenpath = unflatten_path
  }

  dispose(): void {
    // do nothing for now
  }

  [Symbol.dispose](): void {
    // do nothing for now
  }

  get concurrency() {
    return Math.max(1, os.cpus().length - 2)
  }

  get dotpath() {
    return this._dotpath ?? memoizeProp(this, '_dotpath', () => {
      const path = which.sync('dot')
      logger.debug`Found ${path}`
      return path
    })
  }

  get unflattenpath() {
    return this._unflattenpath ?? memoizeProp(this, '_unflattenpath', () => {
      const path = which.sync('unflatten')
      logger.debug`Found ${path}`
      return path
    })
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
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
        logger.warn(`Command ${unflatten.command} has stderr:\n` + unflatten.stderr)
      }
    } catch (error) {
      logger.error(`FAILED GraphvizBinaryAdapter.unflatten`, { error })
      if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
        logger.warn(
          `Command: '${error.command}' returned result but also failed (exitcode ${error.exitCode}):\n` + error.stderr,
        )
        result = error.stdout
      }
    }
    if (result) {
      dot = result.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
    }
    return dot
  }

  async layoutJson(dot: DotSource): Promise<string> {
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
        logger.warn(`Command ${dotcmd.command} has stderr:\n` + dotcmd.stderr)
      }
    } catch (error) {
      logger.error(`FAILED GraphvizBinaryAdapter.layoutJson`, { error })
      logger.warn('FAILED DOT:\n' + dot)
      if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
        logger.warn(
          `Command: '${error.command}' returned result but also failed (exitcode ${error.exitCode}): "${error.stderr}"`,
        )
        result = error.stdout
      } else {
        throw error
      }
    }
    return result
  }

  async acyclic(_dot: DotSource): Promise<DotSource> {
    return Promise.reject(new Error('Method not implemented.'))
  }

  async svg(dot: DotSource): Promise<string> {
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
        logger.warn(`Command ${dotcmd.command} has stderr:\n` + dotcmd.stderr)
      }
    } catch (error) {
      logger.error(`FAILED GraphvizBinaryAdapter.svg`, { error })
      logger.warn('FAILED DOT:\n' + dot)
      if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
        logger.warn(
          `Command: '${error.command}' returned result but also failed (exitcode ${error.exitCode}):\n` + error.stderr,
        )
        result = error.stdout
      } else {
        throw error
      }
    }
    return result
  }
}
