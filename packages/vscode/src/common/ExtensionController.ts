import vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import { State } from 'vscode-languageclient'

import TelemetryReporter from '@vscode/extension-telemetry'
import { disposeAll } from '../util'
import { cmdOpenPreview, cmdRebuild, telemetryKey } from '../const'
import { DotLayouter } from '@likec4/layouts'
import { serializeError, type ViewID } from '@likec4/core'
import { C4Model } from './C4Model'
import { Rpc } from './Rpc'
import { PreviewPanel } from './panel/PreviewPanel'
import { initWorkspace } from './initWorkspace'

export default class ExtensionController implements vscode.Disposable {
  private _disposables: vscode.Disposable[] = []

  private _telemetry: TelemetryReporter

  constructor(
    private _context: vscode.ExtensionContext,
    private _client: LanguageClient
  ) {
    this._context.subscriptions.push(this)

    this._telemetry = new TelemetryReporter(telemetryKey)
    this._disposables.push(this._telemetry)
  }

  /**
   * Deactivate the controller
   */
  deactivate(): void {
    this.dispose()
    console.log('[Extension] extension deactivated')
  }

  dispose() {
    disposeAll(this._disposables)
    console.log(`[Extension] ${this._disposables.length} items disposed`)
    if (this._client.isRunning()) {
      console.log(`[Extension] Stopping language client`)
      void this._client.stop().finally(() => {
        console.log(`[Extension] Language client stopped`)
      })
    }
  }

  /**
   * Initializes the extension
   */
  public async activate() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders ?? []
      console.log(`[Extension] Activate in ${workspaceFolders.length} workspace folders`)
      workspaceFolders.forEach(w => {
        console.log(`  ${w.name}: ${w.uri}`)
      })
      console.log(`[Extension] Starting LanguageClient...`)
      this._client.outputChannel.show(true)
      await this._client.start()

      await this.waitClient()

      console.log(`[Extension] LanguageClient is running`)
      const rpc = new Rpc(this._client)

      await initWorkspace(rpc)

      const dot = new DotLayouter()
      const c4model = new C4Model(this._context, rpc, dot)
      const previewPanel = new PreviewPanel(c4model, rpc, this._context)

      this.registerCommand(cmdOpenPreview, (viewId?: ViewID) => {
        previewPanel.open(viewId ?? ('index' as ViewID))
      })
      this.registerCommand(cmdRebuild, (viewId?: ViewID) => {
        previewPanel.open(viewId ?? ('index' as ViewID))
      })

      this._disposables.push(
        vscode.window.registerWebviewPanelSerializer(PreviewPanel.ViewType, previewPanel),
        previewPanel,
        c4model,
        rpc,
        dot
      )

      this._telemetry.sendTelemetryEvent('activation')
      //
    } catch (e) {
      const { message, error } = serializeError(e)
      console.error(error)
      this._telemetry.sendDangerousTelemetryErrorEvent('activation-failed', { error: message })
      throw error
    }
  }

  private waitClient() {
    console.debug(`[Extension] waitClient`)
    return new Promise<void>((resolve, reject) => {
      if (this._client.state === State.Running) {
        console.debug(`[Extension] LanguageClient is running already`)
        return resolve()
      }
      if (this._client.state === State.Stopped) {
        return reject('LanguageClient is stopped')
      }
      const subscription = this._client.onDidChangeState(e => {
        console.debug(`[Extension] LanguageClient state change ${e.oldState} -> ${e.newState}`)
        if (e.newState === State.Running) {
          console.debug(`[Extension] LanguageClient is running now`)
          subscription.dispose()
          return resolve()
        }
        if (e.newState === State.Stopped) {
          console.debug(`[Extension] LanguageClient is stopped`)
          subscription.dispose()
          return reject('LanguageClient is stopped')
        }
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registerCommand(command: string, callback: (...args: any[]) => any) {
    this._disposables.push(vscode.commands.registerCommand(command, callback))
  }
}
