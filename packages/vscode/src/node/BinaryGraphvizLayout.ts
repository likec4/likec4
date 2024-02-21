import type { ComputedView, DiagramView as LayoutedView } from '@likec4/core'
import type { DotSource } from '@likec4/layouts'
import { parseGraphvizJson, printToDot } from '@likec4/layouts'
import { execa } from 'execa'
import { omit } from 'rambdax'
import type { GraphvizLayout } from '../common/GraphvizLayout'
import { Logger } from '../logger'

export class BinaryGraphvizLayouter implements GraphvizLayout {
  constructor(
    public path: string
  ) {
  }

  async layout(view: ComputedView): Promise<LayoutedView> {
    Logger.debug(`[BinaryGraphvizLayouter.layout] view=${view.id}`)
    let dot = printToDot(view)
    const env = omit(['SERVER_NAME'], process.env)
    const unflatten = await execa('unflatten', ['-f', '-l 1', '-c 2'], {
      env,
      extendEnv: false,
      reject: false,
      timeout: 5_000,
      input: dot,
      stdin: 'pipe',
      encoding: 'utf8'
    })
    Logger.debug(`[BinaryGraphvizLayouter.layout] command(exit:${unflatten.exitCode}): '${unflatten.command}'`)
    if (unflatten instanceof Error) {
      Logger.warn(`Graphviz unflatten: ${unflatten.message}`)
    }
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
    Logger.debug(`[BinaryGraphvizLayouter.layout] command(exit:${result.exitCode}): '${result.command}'`)
    if (result instanceof Error) {
      if (!result.stdout) {
        throw result
      }
      Logger.warn(`Graphviz failed but returned json: ${result.message}`)
    }
    return parseGraphvizJson(result.stdout, view)
  }
}
