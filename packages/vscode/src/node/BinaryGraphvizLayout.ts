import type { ComputedView, DiagramView as LayoutedView } from '@likec4/core'
import { parseGraphvizJson, printToDot } from '@likec4/layouts'
import type { DotSource } from '@likec4/layouts'
import { execa } from 'execa'
import { omit } from 'rambdax'
import * as vscode from 'vscode'
import which from 'which'
import type { ExtensionController } from '../common/ExtensionController'
import type { GraphvizLayout } from '../common/GraphvizLayout'
import { Logger } from '../logger'

function graphvizBinPath() {
  try {
    return which.sync('dot')
  } catch (error) {
    console.error('Error checking for native Graphviz:', error)
    return null
  }
}

export function manageGraphvizLayout(ctrl: ExtensionController) {
  // Default to wasm
  const wasmGraphviz = ctrl.graphviz
  configureGraphviz(graphvizConfig())
  let showedWarning = false

  function configureGraphviz({ mode, path }: GraphvizConfig) {
    if (mode === 'wasm') {
      showedWarning = false
      Logger.info(`[Extension] Graphviz wasm`)
      ctrl.graphviz = wasmGraphviz
      return
    }
    let binaryPath = path ?? graphvizBinPath()

    if (binaryPath === null) {
      Logger.info(`[Extension] Graphviz wasm`)
      ctrl.graphviz = wasmGraphviz
      if (!showedWarning) {
        showedWarning = true
        vscode.window.showWarningMessage('No Graphviz binaries found, sing wasm instead.', {
          detail: 'Switched to WASM\nPlease install Graphviz or set path to binaries.',
          modal: false
        })
      }
      return
    }
    if (ctrl.graphviz instanceof BinaryGraphvizLayouter) {
      ctrl.graphviz.path = binaryPath
    } else {
      ctrl.graphviz = new BinaryGraphvizLayouter(binaryPath)
    }
    Logger.info(`[Extension] Graphviz binary ${binaryPath}`)
  }

  ctrl.onDispose(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('likec4.graphviz')) {
        const nextCfg = graphvizConfig()
        configureGraphviz(nextCfg)
      }
    })
  )
}

function graphvizConfig() {
  const graphvizConfig = vscode.workspace.getConfiguration('likec4.graphviz')
  const mode = graphvizConfig.get<'wasm' | 'binary'>('mode') ?? 'wasm'
  const path = (graphvizConfig.get<string>('path') ?? '').trim()
  return {
    mode,
    path: path != '' ? path : null
  }
}
type GraphvizConfig = ReturnType<typeof graphvizConfig>

class BinaryGraphvizLayouter implements GraphvizLayout {
  constructor(
    public path: string
  ) {
  }

  async layout(view: ComputedView): Promise<LayoutedView> {
    Logger.debug(`[BinaryGraphvizLayouter] layout ${view.id}`)
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
    if (result instanceof Error) {
      if (!result.stdout) {
        throw result
      }
      Logger.warn(`Graphviz failed but returned json: ${result.message}`)
    }
    return parseGraphvizJson(result.stdout, view)
  }
}
