import vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'
import { State } from 'vscode-languageclient'

import { serializeError, type ViewID } from '@likec4/core'
import TelemetryReporter from '@vscode/extension-telemetry'
import { cmdOpenPreview, cmdPreviewContextOpenSource, cmdRebuild, telemetryKey } from '../const'
import { logError, Logger } from '../logger'
import { AbstractDisposable } from '../util'
import { C4Model } from './C4Model'
import { initWorkspace } from './initWorkspace'
import { PreviewPanel } from './panel/PreviewPanel'
import { Rpc } from './Rpc'

export default class ExtensionController extends AbstractDisposable {
  private _telemetry: TelemetryReporter

  constructor(
    private _context: vscode.ExtensionContext,
    private _client: LanguageClient
  ) {
    super()
    this._context.subscriptions.push(this)

    this._telemetry = new TelemetryReporter(telemetryKey)
    this.onDispose(this._telemetry)

    if ('debug' in _client.outputChannel) {
      Logger.channel = _client.outputChannel as unknown as vscode.LogOutputChannel
      Logger.telemetry = this._telemetry
      this.onDispose(() => {
        Logger.channel = null
        Logger.telemetry = null
      })
    }
  }

  /**
   * Deactivate the controller
   */
  deactivate(): void {
    this.dispose()
    Logger.info('[Extension] extension deactivated')
  }

  override dispose() {
    super.dispose()
    Logger.info('[Extension] disposed')
    if (this._client.isRunning()) {
      Logger.info(`[Extension] Stopping language client`)
      void this._client.stop().finally(() => {
        Logger.info(`[Extension] Language client stopped`)
      })
    }
  }

  /**
   * Initializes the extension
   */
  public async activate() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders ?? []
      Logger.info(`[Extension] Activate in ${workspaceFolders.length} workspace folders`)
      workspaceFolders.forEach(w => {
        Logger.info(`  ${w.name}: ${w.uri}`)
      })
      Logger.info(`[Extension] Starting LanguageClient...`)
      this._client.outputChannel.show(true)
      await this._client.start()
      await this.waitClient()

      Logger.info(`[Extension] telemetryLevel=${this._telemetry.telemetryLevel}`)

      const rpc = new Rpc(this._client)

      const c4model = new C4Model(rpc, this._telemetry)
      c4model.turnOnTelemetry()

      const previewPanel = new PreviewPanel(c4model, rpc, this._context)

      this.registerCommand(cmdOpenPreview, (viewId?: ViewID) => {
        previewPanel.open(viewId ?? ('index' as ViewID))
        this._telemetry.sendTelemetryEvent('open-preview')
      })
      this.registerCommand(cmdRebuild, () => {
        initWorkspace(rpc).catch(e => logError(e))
        // rpc.rebuild().catch(e => logError(e))
        this._telemetry.sendTelemetryEvent('rebuild')
      })
      this.registerCommand(cmdPreviewContextOpenSource, () => {
        previewPanel.onContextMenuOpenSource()
      })

      this.onDispose(
        vscode.window.registerWebviewPanelSerializer(PreviewPanel.ViewType, previewPanel),
        previewPanel,
        c4model,
        rpc
      )

      await initWorkspace(rpc)

      this._telemetry.sendTelemetryEvent(
        'activation',
        {},
        {
          workspaceFolders: workspaceFolders.length
        }
      )
      //
    } catch (e) {
      const { message, error } = serializeError(e)
      this._telemetry.sendDangerousTelemetryErrorEvent('activation-failed', { error: message })
      logError(message)
      throw error
    }
  }

  private waitClient() {
    Logger.info(`[Extension] waitClient`)
    return new Promise<void>((resolve, reject) => {
      if (this._client.state === State.Running) {
        Logger.info(`[Extension] LanguageClient is running already`)
        return resolve()
      }
      if (this._client.state === State.Stopped) {
        return reject('LanguageClient is stopped')
      }
      const subscription = this._client.onDidChangeState(e => {
        Logger.info(`[Extension] LanguageClient state change ${e.oldState} -> ${e.newState}`)
        if (e.newState === State.Running) {
          Logger.info(`[Extension] LanguageClient is running now`)
          subscription.dispose()
          return resolve()
        }
        if (e.newState === State.Stopped) {
          Logger.info(`[Extension] LanguageClient is stopped`)
          subscription.dispose()
          return reject('LanguageClient is stopped')
        }
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registerCommand(command: string, callback: (...args: any[]) => any) {
    this.onDispose(vscode.commands.registerCommand(command, callback))
  }
}
