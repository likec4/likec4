import vscode from 'vscode'
import type { BaseLanguageClient as LanguageClient } from 'vscode-languageclient'

import { nonNullable, type ViewID } from '@likec4/core'
import type { LocateParams } from '@likec4/language-server/protocol'
import { GraphvizLayouter, GraphvizWasmAdapter } from '@likec4/layouts'
import { LogLevels } from '@likec4/log'
import TelemetryReporter from '@vscode/extension-telemetry'
import pTimeout from 'p-timeout'
import { BuiltInFileSystemProvider } from './common/BuiltInFileSystemProvider'
import { initWorkspace, rebuildWorkspace } from './common/initWorkspace'
import {
  cmdLocate,
  cmdOpenPreview,
  cmdPreviewContextOpenSource,
  cmdRebuild,
  isProd,
  TelemetryConnectionString
} from './const'
import { LikeC4Model } from './LikeC4Model'
import { addLogReporter, logger } from './logger'
import { Messenger } from './Messenger'
import { Rpc } from './Rpc'
import { AbstractDisposable } from './util'
import { PreviewPanel } from './webview/PreviewPanel'

const StateKeys = {
  informedAboutManualLayout: 'informedAboutManualLayout',
  previewPanelState: 'previewPanelState'
}

export class ExtensionController extends AbstractDisposable {
  public static extensionUri: vscode.Uri
  public static context: vscode.ExtensionContext

  public telemetry: TelemetryReporter | null = null
  protected _rpc: Rpc | null = null
  protected _messenger: Messenger | null = null
  protected _likec4model: LikeC4Model | null = null

  public graphviz: GraphvizLayouter = new GraphvizLayouter(new GraphvizWasmAdapter())

  private static _instance: ExtensionController | null = null

  public static activate(context: vscode.ExtensionContext, client: LanguageClient) {
    if (ExtensionController._instance) {
      throw new Error(`ExtensionController already activated`)
    }
    ExtensionController.extensionUri = context.extensionUri
    ExtensionController.context = context

    BuiltInFileSystemProvider.register(context)

    const ctrl = ExtensionController._instance = new ExtensionController(client)

    ctrl.onDispose(() => {
      client.dispose()
    })

    try {
      const telemetry = ctrl.telemetry = new TelemetryReporter(TelemetryConnectionString)
      ctrl.onDispose(telemetry)
      ctrl.onDispose(addLogReporter(({ level, ...logObj }, ctx) => {
        if (telemetry.telemetryLevel === 'off') {
          return
        }
        if (level !== LogLevels.error && level !== LogLevels.fatal) {
          return
        }
        const tag = logObj.tag || ''
        const parts = logObj.args.map((arg) => {
          if (arg && typeof arg.stack === 'string') {
            return arg.message + '\n' + arg.stack
          }
          if (typeof arg === 'string') {
            return arg
          }
          return String(arg)
        })
        if (tag) {
          parts.unshift(`[${tag}]`)
        }
        const message = parts.join(' ')
        telemetry.sendTelemetryErrorEvent('error', { message })
      }))
    } catch (e) {
      logger.error(e)
    }

    ctrl.activate().then(
      () => {
        logger.info(`Extension activated`)
      },
      (e) => {
        logger.error(`Failed to activate: ${e}`)
      }
    )

    return ctrl
  }

  public static deactivate() {
    ExtensionController._instance?.dispose()
    ExtensionController._instance = null
  }

  get rpc() {
    return nonNullable(this._rpc, 'Rpc not initialized')
  }

  get messenger() {
    return nonNullable(this._messenger, 'Messenger not initialized')
  }

  get likec4model() {
    return nonNullable(this._likec4model, 'LikeC4Model not initialized')
  }

  protected constructor(
    public client: LanguageClient
  ) {
    super()
  }

  /**
   * Initializes the extension
   */
  protected async activate() {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders ?? []
      logger.info(
        `Activate in ${workspaceFolders.length} workspace folders${
          workspaceFolders
            .map(w => `\n  ${w.name}: ${w.uri}`)
            .join('')
        }`
      )
      logger.info(`LanguageClient.needsStart: ${this.client.needsStart()}`)
      logger.info(`LanguageClient.state = ${this.client.state}`)
      logger.info(`telemetryLevel=${this.telemetry?.telemetryLevel}`)

      let startingPromise = Promise.resolve<boolean | undefined>(true)
      if (this.client.needsStart()) {
        const startClient = async () => {
          logger.info(`Starting LanguageClient...`)
          await this.client.start()
          logger.info(`LanguageClient started`)
          return true
        }
        startingPromise = pTimeout(startClient(), {
          milliseconds: 10_000,
          message: false
        })
      }

      const rpc = this._rpc = new Rpc(this.client)
      this.onDispose(rpc)

      const messenger = this._messenger = new Messenger(this)
      this.onDispose(messenger)

      const likeC4Model = this._likec4model = new LikeC4Model(this)
      this.onDispose(likeC4Model)

      this.onDispose(
        vscode.window.registerWebviewPanelSerializer(
          PreviewPanel.ViewType,
          new PreviewPanel.Serializer(this)
        )
      )

      this.registerCommand(cmdRebuild, () => {
        void rebuildWorkspace(rpc)
        this.telemetry?.sendTelemetryEvent('rebuild')
      })

      this.registerCommand(cmdPreviewContextOpenSource, async () => {
        if (!PreviewPanel.current) return
        const { elementId } = await PreviewPanel.current.rpc.getLastClickedNode()
        if (!elementId) return
        await vscode.commands.executeCommand(
          cmdLocate,
          {
            element: elementId
          } satisfies LocateParams
        )
      })

      this.registerCommand(cmdOpenPreview, (viewId?: ViewID) => {
        PreviewPanel.createOrReveal({
          viewId: viewId ?? ('index' as ViewID),
          ctrl: this
        })
        this.telemetry?.sendTelemetryEvent('open-preview')
      })

      this.registerCommand(cmdLocate, async (params: LocateParams) => {
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
          logger.debug(`onDidDeleteFiles`)
          void rebuildWorkspace(rpc)
        })
      )
      if ((await startingPromise) !== true) {
        this.telemetry?.sendTelemetryErrorEvent('lsp-timedout')
        await vscode.window.showErrorMessage(`Failed to start LikeC4 Language Server.
Restart VSCode. Please report this issue, if it persists.`)
        return
      }

      await initWorkspace(rpc)

      if (isProd && this.telemetry && this.telemetry.telemetryLevel !== 'off') {
        this.telemetry?.sendTelemetryEvent(
          'activation',
          {},
          {
            workspaceFolders: workspaceFolders.length
          }
        )
        likeC4Model.turnOnTelemetry()
      }
      //
    } catch (e) {
      if (e instanceof Error) {
        void vscode.window.showErrorMessage(e.message)
        logger.error(e)
      }
      return Promise.reject(e)
    }
  }

  private registerCommand(command: string, callback: (...args: any[]) => any) {
    this.onDispose(vscode.commands.registerCommand(command, callback))
  }

  // public getPreviewPanelState(): PreviewPanelInternalState {
  //   const state = this._context.workspaceState.get<Partial<PreviewPanelInternalState>>(StateKeys.previewPanelState)
  //   return {
  //     edgesEditable: state?.edgesEditable ?? true,
  //     nodesDraggable: state?.nodesDraggable ?? true
  //   }
  // }

  // public setPreviewPanelState(state: PreviewPanelInternalState) {
  //   this._context.workspaceState.update(StateKeys.previewPanelState, state)
  // }
}
