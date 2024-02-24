import type { ComputedView, DiagramView as LayoutedView } from '@likec4/core'
import { execa } from 'execa'
import { env as processenv } from 'node:process'
import { omit } from 'rambdax'
import { parseGraphvizJson } from '../dotLayout'
import type { GraphvizLayouter } from '../DotLayouter'
import { printToDot } from '../printToDot'
import type { DotLayoutResult, DotSource } from '../types'

// @ts-ignore
const isDev = process.env.NODE_ENV === 'development'

export class BinaryGraphvizLayouter implements GraphvizLayouter {
  constructor(
    // Path to the binary, e.g. 'dot' or '/usr/bin/dot'
    public path: string = 'dot'
  ) {
  }

  dispose(): void {
    // no-op
  }

  async layout(view: ComputedView): Promise<DotLayoutResult> {
    // console.debug(`[BinaryGraphvizLayouter.layout] view=${view.id}`)
    let dot = printToDot(view)
    const env = omit(['SERVER_NAME'], processenv)
    const unflatten = await execa('unflatten', ['-f', '-l 1', '-c 2'], {
      env,
      extendEnv: false,
      reject: false,
      timeout: 5_000,
      input: dot,
      stdin: 'pipe',
      encoding: 'utf8'
    })
    if (unflatten.exitCode !== 0) {
      console.warn(`[BinaryGraphvizLayouter.layout] command(exit:${unflatten.exitCode}): '${unflatten.command}'`)
    }
    // if (unflatten instanceof Error) {
    //   console.warn(`Graphviz unflatten: ${unflatten.message}`)
    // }
    if (unflatten.stdout) {
      dot = unflatten.stdout as DotSource
    }

    const result = await execa(this.path, ['-Tjson', '-y'], {
      env,
      extendEnv: false,
      reject: false,
      timeout: 5_000,
      input: dot,
      stdin: 'pipe',
      encoding: 'utf8'
    })
    if (result.exitCode !== 0) {
      console.warn(`[BinaryGraphvizLayouter.layout] command(exit:${result.exitCode}): '${result.command}'`)
    }
    if (result instanceof Error) {
      if (!result.stdout) {
        throw result
      }
      // console.warn(`Graphviz failed but returned json: ${result.message}`)
    }
    const diagram = parseGraphvizJson(result.stdout, view)
    return {
      dot,
      diagram
    }
  }

  async svg(dot: string, _view: ComputedView): Promise<string> {
    const env = omit(['SERVER_NAME'], processenv)
    const result = await execa(this.path, ['-Tsvg', '-y'], {
      env,
      extendEnv: false,
      reject: false,
      timeout: 5_000,
      input: dot,
      stdin: 'pipe',
      encoding: 'utf8'
    })
    if (result.exitCode !== 0) {
      console.warn(`[BinaryGraphvizLayouter.layout] command(exit:${result.exitCode}): '${result.command}'`)
    }
    if (result instanceof Error) {
      if (!result.stdout) {
        throw result
      }
      // console.warn(`Graphviz failed (but returned svg): ${result.message}`)
    }
    return result.stdout
  }
}
