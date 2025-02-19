import vscode, { Diagnostic } from 'vscode'
import type {
  BaseLanguageClient as LanguageClient,
  DiagnosticSeverity as lcDiagnosticSeverity,
} from 'vscode-languageclient'
import lc from 'vscode-languageclient'

import { type ViewId as ViewID, nonNullable } from '@likec4/core'
import type { LocateParams } from '@likec4/language-server/protocol'
import type TelemetryReporter from '@vscode/extension-telemetry'
import pTimeout from 'p-timeout'
import { entries, groupBy, map, pipe, prop, values } from 'remeda'
import { BuiltInFileSystemProvider } from './common/BuiltInFileSystemProvider'
import { initWorkspace, rebuildWorkspace } from './common/initWorkspace'
import {
  cmdLocate,
  cmdOpenPreview,
  cmdPreviewContextOpenSource,
  cmdPrintDot,
  cmdRebuild,
  cmdValidateLayout,
  isProd,
} from './const'
import { LikeC4Model } from './LikeC4Model'
import { logError, logger, logWarn } from './logger'
import { Messenger } from './Messenger'
import { Rpc } from './Rpc'
import { AbstractDisposable } from './util'
import { PreviewPanel } from './webview/PreviewPanel'

const StateKeys = {
  informedAboutManualLayout: 'informedAboutManualLayout',
  previewPanelState: 'previewPanelState',
}

export class ExtensionController extends AbstractDisposable {
  public static extensionUri: vscode.Uri
  public static context: vscode.ExtensionContext

  public telemetry: TelemetryReporter | null = null
  protected _rpc: Rpc | null = null
  protected _messenger: Messenger | null = null
  protected _likec4model: LikeC4Model | null = null
  protected _layoutDiagnosticsCollection: vscode.DiagnosticCollection | null = null

  private static _instance: ExtensionController | null = null

  public static activate(
    context: vscode.ExtensionContext,
    client: LanguageClient,
    outputChannel: vscode.LogOutputChannel = client.outputChannel as vscode.LogOutputChannel,
  ) {
    if (ExtensionController._instance) {
      throw new Error(`ExtensionController already activated`)
    }
    ExtensionController.extensionUri = context.extensionUri
    ExtensionController.context = context

    BuiltInFileSystemProvider.register(context)

    const ctrl = ExtensionController._instance = new ExtensionController(client, outputChannel)

    ctrl.onDispose(() => {
      client.dispose()
    })

    ctrl.onDispose(
      vscode.window.registerWebviewPanelSerializer(
        PreviewPanel.ViewType,
        new PreviewPanel.Serializer(ctrl),
      ),
    )

    const rpc = ctrl._rpc = new Rpc(client)
    ctrl.onDispose(rpc)

    const messenger = ctrl._messenger = new Messenger(ctrl)
    ctrl.onDispose(messenger)

    const likeC4Model = ctrl._likec4model = new LikeC4Model(ctrl)
    ctrl.onDispose(likeC4Model)

    const layoutDiagnosticsCollection = ctrl._layoutDiagnosticsCollection = vscode.languages.createDiagnosticCollection(
      'likec4:layout',
    )
    context.subscriptions.push(layoutDiagnosticsCollection)
    ctrl.onDispose(layoutDiagnosticsCollection)

    ctrl.registerCommand(cmdRebuild, () => {
      void rebuildWorkspace(ctrl.rpc)
      ctrl.telemetry?.sendTelemetryEvent('rebuild')
    })

    ctrl.registerCommand(cmdPreviewContextOpenSource, async () => {
      if (!PreviewPanel.current) return
      const { elementId } = await PreviewPanel.current.rpc.getLastClickedNode()
      if (!elementId) return
      await vscode.commands.executeCommand(
        cmdLocate,
        {
          element: elementId,
        } satisfies LocateParams,
      )
    })

    ctrl.registerCommand(cmdOpenPreview, async (viewId?: ViewID) => {
      if (!viewId) {
        try {
          const { model } = await ctrl.likec4model.fetchComputedModel()
          const views = values(model?.views ?? {}).map(v => ({
            label: v.id,
            description: v.title ?? '',
            viewId: v.id,
          })).sort((a, b) => {
            if (a.label === 'index') {
              return -1
            }
            if (b.label === 'index') {
              return 1
            }
            return a.label.localeCompare(b.label)
          })
          if (views.length === 0) {
            await vscode.window.showWarningMessage('No views found', { modal: true })
            return
          }
          const selected = await vscode.window.showQuickPick(views, {
            canPickMany: false,
            title: 'Select a view',
          })
          if (!selected) {
            return
          }

          viewId = selected.viewId
        } catch (e) {
          logWarn(e)
          return
        }
      }
      PreviewPanel.createOrReveal({
        viewId: viewId ?? ('index' as ViewID),
        ctrl,
      })
      ctrl.telemetry?.sendTelemetryEvent('open-preview')
    })

    ctrl.registerCommand(cmdPrintDot, async () => {
      const viewId = PreviewPanel.current?.viewId
      if (!viewId) {
        logger.warn(`No preview panel found`)
        return
      }
      const result = await ctrl.likec4model.layoutView(viewId)
      if (!result) {
        logger.warn(`Failed to layout view ${viewId}`)
        return
      }
      logger.info(`DOT of view "${viewId}":\n${result.dot}`)
      ctrl.outputChannel.show(true)
    })

    ctrl.registerCommand(cmdLocate, async (params: LocateParams) => {
      const loc = await ctrl.rpc.locate(params)
      if (!loc) return
      const location = ctrl.client.protocol2CodeConverter.asLocation(loc)
      let viewColumn = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One
      if (PreviewPanel.current?.panel.viewColumn === viewColumn) {
        viewColumn = vscode.ViewColumn.Beside
      }
      const editor = await vscode.window.showTextDocument(location.uri, {
        viewColumn,
        selection: location.range,
        preserveFocus: viewColumn === vscode.ViewColumn.Beside,
      })
      editor.revealRange(location.range)
    })

    ctrl.registerCommand(cmdValidateLayout, async () => {
      const result = await ctrl.likec4model.validateLayout()

      if (!result) {
        logger.warn('Failed to layout views')
        ctrl.outputChannel.show(true)
        return
      }

      const diagnostic = pipe(
        result,
        groupBy(prop('uri')),
        entries(),
        map(([uri, messages]) => ([
          vscode.Uri.parse(uri),
          messages.map(m =>
            new Diagnostic(
              ExtensionController.convertRange(m.range),
              m.message,
              ExtensionController.convertSeverity(m.severity ?? lc.DiagnosticSeverity.Error),
            )
          ),
        ] satisfies [vscode.Uri, Diagnostic[]])),
      )
      layoutDiagnosticsCollection.clear()
      layoutDiagnosticsCollection.set(diagnostic)
    })

    if (isProd) {
      ctrl.enableTelemetry().catch(e => {
        logger.error(`Failed to enable telemetry`, e)
      })
    } else {
      logger.debug(`Telemetry disabled in development mode`)
    }

    ctrl.activate().then(
      () => {
        logger.info(`Extension activated`)
      },
      (e) => {
        logger.error(`Failed to activate: ${e}`)
      },
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

  static get telemetry(): TelemetryReporter | null {
    return ExtensionController._instance?.telemetry ?? null
  }

  protected constructor(
    public readonly client: LanguageClient,
    public readonly outputChannel: vscode.LogOutputChannel,
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
        }`,
      )
      logger.debug(`LanguageClient.needsStart: ${this.client.needsStart()}`)
      logger.debug(`LanguageClient.state = ${this.client.state}`)

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
          message: false,
        })
      }

      this.onDispose(() => {
        PreviewPanel.current?.dispose()
      })

      this.onDispose(
        vscode.workspace.onDidDeleteFiles(_ => {
          logger.debug(`onDidDeleteFiles`)
          void rebuildWorkspace(this.rpc)
        }),
      )
      if ((await startingPromise) !== true) {
        this.telemetry?.sendTelemetryErrorEvent('lsp-timedout')
        await vscode.window.showErrorMessage(`Failed to start LikeC4 Language Server.
Restart VSCode. Please report this issue, if it persists.`)
        return
      }

      await initWorkspace(this.rpc)

      if (isProd && this.telemetry && this.telemetry.telemetryLevel !== 'off') {
        this.telemetry?.sendTelemetryEvent(
          'activation',
          {},
          {
            workspaceFolders: workspaceFolders.length,
          },
        )
        this.likec4model.turnOnTelemetry()
      }
      //
    } catch (e) {
      if (e instanceof Error) {
        void vscode.window.showErrorMessage(e.message)
        logError(e)
      }
      return Promise.reject(e)
    }
  }

  private registerCommand(command: string, callback: (...args: any[]) => any) {
    this.onDispose(vscode.commands.registerCommand(command, callback))
  }

  private async enableTelemetry() {
    logger.debug(`Enable telemetry`)
    const ctrl = this
    const { telemetry } = await import('./telemetry')

    logger.debug(`telemetryLevel=${telemetry.telemetryLevel}`)
    ctrl.telemetry = telemetry
    ctrl.onDispose(telemetry)
    ctrl.onDispose(this.client.onTelemetry(event => {
      try {
        const { eventName, ...properties } = event
        if (eventName === 'error') {
          if ('stack' in properties) {
            properties.stack = new vscode.TelemetryTrustedValue(properties.stack)
          }
          telemetry.sendTelemetryErrorEvent('error', properties)
          return
        }
        telemetry.sendTelemetryEvent(eventName, properties)
      } catch (e) {
        logWarn(e)
      }
    }))
  }

  private static convertSeverity(severity: lcDiagnosticSeverity): vscode.DiagnosticSeverity {
    switch (severity) {
      case 1:
        return vscode.DiagnosticSeverity.Error
      case 2:
        return vscode.DiagnosticSeverity.Warning
      case 3:
        return vscode.DiagnosticSeverity.Information
      case 4:
        return vscode.DiagnosticSeverity.Hint
    }
  }

  private static convertRange(range: lc.Range): vscode.Range {
    return new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character)
  }
}
