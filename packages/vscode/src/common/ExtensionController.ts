import vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'

import { normalizeError, type ViewID } from '@likec4/core'
import type { GraphvizLayouter } from '@likec4/layouts'
import { WasmGraphvizLayouter } from '@likec4/layouts'
import type { WebviewToExtension } from '@likec4/vscode-preview/protocol'
import TelemetryReporter from '@vscode/extension-telemetry'
import { cmdLocate, cmdOpenPreview, cmdPreviewContextOpenSource, cmdRebuild, telemetryKey } from '../const'
import { Logger } from '../logger'
import { AbstractDisposable } from '../util'
import { C4Model } from './C4Model'
import { initWorkspace, rebuildWorkspace } from './initWorkspace'
import Messenger from './Messenger'
import { PreviewPanel } from './panel/PreviewPanel'
import { Rpc } from './Rpc'

export class ExtensionController extends AbstractDisposable {
  public static extensionUri: vscode.Uri

  private _telemetry: TelemetryReporter

  public graphviz: GraphvizLayouter = new WasmGraphvizLayouter()

  constructor(
    private _context: vscode.ExtensionContext,
    public client: LanguageClient
  ) {
    super()
    ExtensionController.extensionUri = _context.extensionUri

    this.onDispose(() => {
      client.outputChannel.dispose()
      void client.dispose()
      Logger.info(`[Extension] Language client disposed`)
    })
    this._telemetry = new TelemetryReporter(telemetryKey)
    this.onDispose(this._telemetry)

    if ('debug' in client.outputChannel) {
      Logger.channel = client.outputChannel as unknown as vscode.LogOutputChannel
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
  async deactivate() {
    if (this.client.isRunning()) {
      Logger.info(`[Extension] Stopping language client`)
      try {
        await this.client.stop()
      } catch (e) {
        Logger.error(normalizeError(e))
      }
    }
    Logger.info(`[Extension] Language client stopped`)
    this.dispose()
    Logger.info('[Extension] extension deactivated')
  }

  override dispose() {
    super.dispose()
    Logger.info('[Extension] disposed')
  }

  /**
   * Initializes the extension
   */
  public async activate() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders ?? []
      Logger.info(
        `[Extension] Activate in ${workspaceFolders.length} workspace folders${
          workspaceFolders
            .map(w => `\n  ${w.name}: ${w.uri}`)
            .join('')
        }`
      )
      Logger.info(`[Extension] Starting LanguageClient...`)
      this.client.outputChannel.show(true)
      await this.client.start()
      Logger.info(`[Extension] LanguageClient.state = ${this.client.state}`)

      Logger.info(`[Extension] telemetryLevel=${this._telemetry.telemetryLevel}`)

      const rpc = new Rpc(this.client)
      this.onDispose(rpc)

      const messenger = new Messenger(rpc)
      this.onDispose(messenger)

      const c4model = new C4Model(this, rpc, this._telemetry)
      c4model.turnOnTelemetry()
      this.onDispose(c4model)

      this.onDispose(
        vscode.window.registerWebviewPanelSerializer(
          PreviewPanel.ViewType,
          PreviewPanel.Serializer({
            c4model,
            messenger
          })
        )
      )
      this.registerCommand(cmdRebuild, () => {
        void rebuildWorkspace(rpc)
        this._telemetry.sendTelemetryEvent('rebuild')
      })
      this.registerCommand(cmdPreviewContextOpenSource, async () => {
        const { elementId } = await messenger.getHoveredElement()
        if (!elementId) return
        await vscode.commands.executeCommand(
          cmdLocate,
          {
            element: elementId
          } satisfies WebviewToExtension.LocateParams
        )
      })

      this.registerCommand(cmdOpenPreview, (viewId?: ViewID) => {
        PreviewPanel.createOrShow({
          viewId: viewId ?? ('index' as ViewID),
          c4model,
          messenger
        })
        this._telemetry.sendTelemetryEvent('open-preview')
      })
      this.registerCommand(cmdLocate, async (params: WebviewToExtension.LocateParams) => {
        const loc = await rpc.locate(params)
        if (!loc) return
        const location = this.client.protocol2CodeConverter.asLocation(loc)
        const editor = await vscode.window.showTextDocument(location.uri, {
          viewColumn: vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One,
          selection: location.range
        })
        editor.revealRange(location.range, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
      })
      this.onDispose(() => {
        PreviewPanel.current?.dispose()
      })

      await initWorkspace(rpc)

      this.onDispose(
        vscode.workspace.onDidDeleteFiles(_ => {
          Logger.debug(`[Extension] onDidDeleteFiles`)
          void rebuildWorkspace(rpc)
        })
      )

      this._telemetry.sendTelemetryEvent(
        'activation',
        {},
        {
          workspaceFolders: workspaceFolders.length
        }
      )
      Logger.info(`[Extension] activated`)
      //
    } catch (e) {
      const error = normalizeError(e)
      Logger.error(error)
      throw error
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registerCommand(command: string, callback: (...args: any[]) => any) {
    this.onDispose(vscode.commands.registerCommand(command, callback))
  }
}
