import { memoizeProp } from '@likec4/core/utils'
import { loggable, rootLogger as mainLogger } from '@likec4/log'
import spawn, { SubprocessError } from 'nano-spawn'
import os from 'node:os'
import { isEmpty, randomString } from 'remeda'
import which from 'which'
import type { GraphvizPort } from '../GraphvizLayoter'
import type { DotSource } from '../types'

const rootLogger = mainLogger.getChild(['graphviz', 'binary'])

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

  get name() {
    return 'binary'
  }

  dispose(): void {
    // do nothing for now
  }

  [Symbol.dispose](): void {
    // do nothing for now
  }

  get concurrency() {
    return Math.max(1, os.availableParallelism() - 2)
  }

  get dotpath() {
    return this._dotpath ?? memoizeProp(this, '_dotpath', () => {
      const path = which.sync('dot')
      rootLogger.debug`Found ${path}`
      return path
    })
  }

  get unflattenpath() {
    return this._unflattenpath ?? memoizeProp(this, '_unflattenpath', () => {
      const path = which.sync('unflatten')
      rootLogger.debug`Found ${path}`
      return path
    })
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    let result: string | undefined
    const logger = rootLogger.getChild(['unflatten', randomString(4)])
    try {
      const unflatten = await spawn(this.unflattenpath, ['-l', '1', '-c', '3'], {
        timeout: 10_000,
        stdin: {
          string: dot,
        },
      })
      result = unflatten.stdout
      if (!isEmpty(unflatten.stderr)) {
        logger.warn(`{command} has stderr:\n` + unflatten.stderr, {
          command: unflatten.command,
        })
      } else {
        logger.trace(`{command} succeeded in {durationMs}ms`, {
          command: unflatten.command,
          durationMs: Math.round(unflatten.durationMs),
        })
      }
    } catch (error) {
      logger.debug('FAILED DOT', { dot })
      logger.error(loggable(error))
      if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
        logger.warn('{command} returned result but failed with exitcode {exitCode}:\n{stderr}', {
          command: error.command,
          exitCode: error.exitCode,
          stderr: error.stderr,
        })
        result = error.stdout
      }
    }
    if (result) {
      dot = result.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
    }
    return dot
  }

  async layoutJson(dot: DotSource): Promise<string> {
    const logger = rootLogger.getChild(['layoutJson', randomString(4)])
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
        logger.warn(`{command} has stderr:\n` + dotcmd.stderr, {
          command: dotcmd.command,
        })
      } else {
        logger.trace(`{command} succeeded in {durationMs}ms`, {
          command: dotcmd.command,
          durationMs: Math.round(dotcmd.durationMs),
        })
      }
    } catch (error) {
      logger.debug('FAILED DOT', { dot })
      logger.error(loggable(error))
      if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
        logger.warn('{command} returned result but failed with exitcode {exitCode}:\n{stderr}', {
          command: error.command,
          exitCode: error.exitCode,
          stderr: error.stderr,
        })
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
    const logger = rootLogger.getChild(['svg', randomString(4)])
    let result: string | undefined
    try {
      const cmd = await spawn(this.dotpath, ['-Tsvg', '-y'], {
        timeout: 10_000,
        stdin: {
          string: dot,
        },
      })
      result = cmd.stdout
      if (!isEmpty(cmd.stderr)) {
        logger.warn(`{command} has stderr:\n` + cmd.stderr, {
          command: cmd.command,
        })
      } else {
        logger.trace(`{command} succeeded in {durationMs}ms`, {
          command: cmd.command,
          durationMs: Math.round(cmd.durationMs),
        })
      }
    } catch (error) {
      logger.debug('FAILED DOT', { dot })
      logger.error(loggable(error))
      if (error instanceof SubprocessError && !isEmpty(error.stdout)) {
        logger.warn('{command} returned result but failed with exitcode {exitCode}:\n{stderr}', {
          command: error.command,
          exitCode: error.exitCode,
          stderr: error.stderr,
        })
        result = error.stdout
      } else {
        throw error
      }
    }
    return result
  }
}
