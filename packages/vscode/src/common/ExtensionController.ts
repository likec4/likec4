import vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'

import { nonNullable, type ViewID } from '@likec4/core'
import { GraphvizLayouter } from '@likec4/layouts'
import { GraphvizWasmAdapter } from '@likec4/layouts/graphviz/wasm'
import type { WebviewToExtension } from '@likec4/vscode-preview/protocol'
import TelemetryReporter from '@vscode/extension-telemetry'
import pTimeout from 'p-timeout'
import {
  cmdLocate,
  cmdOpenPreview,
  cmdPreviewContextOpenSource,
  cmdRebuild,
  isDev,
  isProd,
  telemetryKey
} from '../const'
import { Logger } from '../logger'
import { AbstractDisposable } from '../util'
import { BuiltInFileSystemProvider } from './BuiltInFileSystemProvider'
import { C4Model } from './C4Model'
import { initWorkspace, rebuildWorkspace } from './initWorkspace'
import Messenger from './Messenger'
import { PreviewPanel, type PreviewPanelInternalState } from './panel/PreviewPanel'
import { Rpc } from './Rpc'

const StateKeys = {
  informedAboutManualLayout: 'informedAboutManualLayout',
  previewPanelState: 'previewPanelState'
}

export class ExtensionController extends AbstractDisposable {
  public static extensionUri: vscode.Uri

  private _telemetry: TelemetryReporter
  private _rpc: Rpc | null = null
  private _c4model: C4Model | null = null
  private _messenger: Messenger | null = null

  public graphviz: GraphvizLayouter = new GraphvizLayouter(new GraphvizWasmAdapter())

  get c4model() {
    return nonNullable(this._c4model, 'C4Model not initialized')
  }

  get rpc() {
    return nonNullable(this._rpc, 'Rpc not initialized')
  }

  get messenger() {
    return nonNullable(this._messenger, 'Messenger not initialized')
  }

  constructor(
    private _context: vscode.ExtensionContext,
    public client: LanguageClient
  ) {
    super()
    ExtensionController.extensionUri = _context.extensionUri
    BuiltInFileSystemProvider.register(this._context)

    this.onDispose(() => {
      client.dispose()
      Logger.info(`[Extension] Language client disposed`)
    })
    this._telemetry = new TelemetryReporter(telemetryKey)
    this.onDispose(this._telemetry)

    Logger.telemetry = this._telemetry
    this.onDispose(() => {
      Logger.telemetry = null
    })
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
      Logger.info(`[Extension] LanguageClient.needsStart: ${this.client.needsStart()}`)
      Logger.info(`[Extension] LanguageClient.state = ${this.client.state}`)
      Logger.info(`[Extension] telemetryLevel=${this._telemetry.telemetryLevel}`)

      let startingPromise = Promise.resolve<boolean | undefined>(true)
      if (this.client.needsStart()) {
        const startClient = async () => {
          Logger.info(`[Extension] Starting LanguageClient...`)
          await this.client.start()
          Logger.info(`[Extension] LanguageClient started`)
          return true
        }
        startingPromise = pTimeout(startClient(), {
          milliseconds: 10_000,
          message: false
        })
      }

      const rpc = this._rpc = new Rpc(this.client)
      this.onDispose(rpc)

      const c4model = this._c4model = new C4Model(this, this._telemetry)
      this.onDispose(c4model)

      const messenger = this._messenger = new Messenger(this)
      this.onDispose(messenger)

      this.onDispose(
        vscode.window.registerWebviewPanelSerializer(
          PreviewPanel.ViewType,
          PreviewPanel.Serializer({
            ctrl: this
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
          ctrl: this
        })
        this._telemetry.sendTelemetryEvent('open-preview')
      })
      this.registerCommand(cmdLocate, async (params: WebviewToExtension.LocateParams) => {
        const loc = await rpc.locate(params)
        if (!loc) return
        const location = this.client.protocol2CodeConverter.asLocation(loc)
        let viewColumn = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One
        if (PreviewPanel.current?.panel.viewColumn === viewColumn) {
          viewColumn = vscode.ViewColumn.Beside
        }
        const editor = await vscode.window.showTextDocument(location.uri, {
          viewColumn,
          selection: location.range,
          preserveFocus: viewColumn === vscode.ViewColumn.Beside
        })
        editor.revealRange(location.range)
      })

      this.onDispose(() => {
        PreviewPanel.current?.dispose()
      })

      this.onDispose(
        vscode.workspace.onDidDeleteFiles(_ => {
          Logger.debug(`[Extension] onDidDeleteFiles`)
          void rebuildWorkspace(rpc)
        })
      )
      if ((await startingPromise) !== true) {
        this._telemetry.sendTelemetryErrorEvent('lsp-timedout')
        await vscode.window.showErrorMessage(`Failed to start LikeC4 Language Server.
Restart VSCode. Please report this issue, if it persists.`)
        return Promise.reject()
      }

      await initWorkspace(rpc)

      if (isProd) {
        c4model.turnOnTelemetry()

        this._telemetry.sendTelemetryEvent(
          'activation',
          {},
          {
            workspaceFolders: workspaceFolders.length
          }
        )
      }
      Logger.info(`[Extension] activated`)
      //
    } catch (e) {
      if (e instanceof Error) {
        void vscode.window.showErrorMessage(e.message)
        Logger.error(e)
      }
      return Promise.reject(e)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private registerCommand(command: string, callback: (...args: any[]) => any) {
    this.onDispose(vscode.commands.registerCommand(command, callback))
  }

  public getPreviewPanelState(): PreviewPanelInternalState {
    const state = this._context.workspaceState.get<Partial<PreviewPanelInternalState>>(StateKeys.previewPanelState)
    return {
      edgesEditable: state?.edgesEditable ?? true,
      nodesDraggable: state?.nodesDraggable ?? true
    }
  }

  public setPreviewPanelState(state: PreviewPanelInternalState) {
    this._context.workspaceState.update(StateKeys.previewPanelState, state)
  }
}
