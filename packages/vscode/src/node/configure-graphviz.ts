import { GraphvizBinaryAdapter } from '@likec4/layouts/graphviz/binary'
import * as vscode from 'vscode'
import which from 'which'
import type { ExtensionController } from '../common/ExtensionController'
import { logger } from '../logger'

function graphvizBinPath() {
  try {
    return which.sync('dot')
  } catch (error) {
    logger.error('Error checking for native Graphviz:', error)
    return null
  }
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

export function configureGraphviz(ctrl: ExtensionController) {
  // Default to wasm
  let showedWarning = false
  const wasmGraphviz = ctrl.graphviz
  configureGraphviz(graphvizConfig())

  function configureGraphviz({ mode, path }: GraphvizConfig) {
    if (mode === 'wasm') {
      showedWarning = false
      logger.info(`Graphviz wasm`)
      ctrl.graphviz = wasmGraphviz
      return
    }
    let binaryPath = path ?? graphvizBinPath()

    if (binaryPath === null) {
      logger.info(`Graphviz wasm`)
      ctrl.graphviz = wasmGraphviz
      if (!showedWarning) {
        showedWarning = true
        vscode.window.showWarningMessage('No Graphviz binaries found, sing wasm instead.', {
          detail: 'Switched to WASM\nPlease install Graphviz or configure path to binaries.',
          modal: false
        })
      }
      return
    }

    ctrl.graphviz.changePort(new GraphvizBinaryAdapter(binaryPath))

    logger.info(`Graphviz binary ${binaryPath}`)
  }

  ctrl.onDispose(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('likec4.graphviz')) {
        logger.debug(`onDidChangeConfiguration`)
        const nextCfg = graphvizConfig()
        configureGraphviz(nextCfg)
      }
    })
  )

  logger.info(`Graphviz configured`)
}
