/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type { Fqn, RelationID, ViewID, DiagramView } from '@likec4/core/types'
import * as vscode from 'vscode'
import type { Disposable, Webview, WebviewPanel } from 'vscode'
import { ADisposable, getNonce } from 'src/util'
import type { ExtensionContext, C4Model, LanguageClient, Logger, Telemetry } from 'src/di'
import { di } from 'src/di'
import { tokens } from 'typed-inject'
import type { PanelToExtensionProtocol } from '@likec4/vscode-preview/protocol'
import type { Location } from 'vscode-languageclient/lib/common/api'
import { Rpc } from '../protocol'
import { nonexhaustive } from '@likec4/core/errors'

function getUri(webview: Webview, extensionUri: vscode.Uri, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList))
}

export class PreviewPanel extends ADisposable implements vscode.WebviewPanelSerializer {
  private panel: WebviewPanel | null = null
  private listener: Disposable | null = null
  private currentViewId: ViewID | null = null

  static ViewType = 'likec4-preview' as const
  static inject = tokens(di.c4model, di.client, di.context, di.logger, di.telemetry)
  constructor(
    private c4model: C4Model,
    private client: LanguageClient,
    private context: ExtensionContext,
    private logger: Logger,
    private telemetry: Telemetry
  ) {
    super()
  }

  async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: unknown) {
    this.currentViewId = null
    this.panel = webviewPanel
    this.initPanel()
    // TODO: refactor guard
    if (
      state != null &&
      typeof state === 'object' &&
      'view' in state &&
      state.view != null &&
      typeof state.view === 'object' &&
      'id' in state.view &&
      typeof state.view.id === 'string'
    ) {
      this.currentViewId = state.view.id as ViewID
    }
    return Promise.resolve()
  }

  public open(viewId: ViewID) {
    this.logger.logDebug('PreviewPanel.open', { viewId })
    if (this.panel) {
      this.panel.reveal(undefined, true)
      this.subscribeToModel(viewId)
      return
    }
    this.telemetry.sendTelemetryEvent('PreviewPanel.open')
    this.currentViewId = viewId
    this.panel = this.createWebviewPanel()
    this.initPanel()
    // Subscribe to model happends on "ready" from webview
    // this.subscribeToModel(viewId)
  }

  private subscribeToModel(viewId: ViewID) {
    this.unsubscribe()
    this.currentViewId = viewId
    this.listener = this.c4model.subscribeToView(viewId, data => {
      this.sendUpdate(data)
    })
  }

  private unsubscribe() {
    this.listener?.dispose()
    this.listener = null
  }

  private initPanel() {
    if (!this.panel) {
      throw new Error('PreviewPanel is not initialized')
    }

    this.panel.webview.onDidReceiveMessage(this.onWebviewMessage, this, this._disposables)

    this.panel.onDidDispose(
      () => {
        this.logger.logDebug('panel.onDidDispose')
        this.panel = null
        this.close()
      },
      this,
      this._disposables
    )
    this.panel.onDidChangeViewState(
      ({ webviewPanel }) => {
        if (!webviewPanel.visible) {
          this.unsubscribe()
        }
      },
      this,
      this._disposables
    )

    this.updateWebviewContent()
  }

  private close() {
    this.telemetry.sendTelemetryEvent('PreviewPanel.close')
    this.unsubscribe()
    this.panel?.dispose()
    this.panel = null
    this.currentViewId = null
  }

  private sendUpdate(view: DiagramView) {
    if (!this.panel) {
      this.logger.logWarn('sendUpdate: panel is not initialized')
      return
    }
    if (!this.panel.visible) {
      this.logger.logDebug('ignore sendUpdate: panel is not visible')
      return
    }
    this.panel.title = view.title ?? 'Untitled'
    void this.panel.webview
      .postMessage({
        kind: 'update',
        view
      })
      .then(
        posted => {
          if (!posted) {
            this.logger.logWarn('sendUpdate: message not posted')
          }
        },
        err => this.logger.logError(err)
      )
  }

  private goToSource = async (element: Fqn) => {
    return await this.client.sendRequest(Rpc.locateElement, { element })
  }

  private goToRelation = async (id: RelationID) => {
    return await this.client.sendRequest(Rpc.locateRelation, { id })
  }

  private goToViewSource = async (id: ViewID) => {
    return await this.client.sendRequest(Rpc.locateView, { id })
  }

  private goToLocation = async (loc: Location | null) => {
    if (!loc) {
      return
    }
    const panelViewColumn = this.panel?.viewColumn ?? vscode.ViewColumn.Two
    const location = this.client.protocol2CodeConverter.asLocation(loc)
    await vscode.window.showTextDocument(location.uri, {
      viewColumn:
        panelViewColumn !== vscode.ViewColumn.One ? vscode.ViewColumn.One : panelViewColumn,
      selection: location.range
    })
  }

  private onWebviewMessage = (message: PanelToExtensionProtocol) => {
    this.logger.logDebug(`from webview: ${message.kind}`, message)
    switch (message.kind) {
      case 'close': {
        this.close()
        return
      }
      case 'ready': {
        if (this.currentViewId) {
          this.subscribeToModel(this.currentViewId)
        } else {
          this.logger.logWarn('ready: currentViewId is not set')
        }
        return
      }
      case 'open': {
        this.open(message.viewId)
        return
      }
      case 'goToRelationSource': {
        void this.goToRelation(message.relationId).then(this.goToLocation)
        return
      }
      case 'goToElementSource': {
        void this.goToSource(message.element).then(this.goToLocation)
        return
      }
      case 'goToViewSource': {
        void this.goToViewSource(message.viewId).then(this.goToLocation)
        return
      }
    }
    // @ts-expect-error - nonexhaustive
    nonexhaustive(message)
  }

  private getWebviewOptions(): vscode.WebviewOptions & vscode.WebviewPanelOptions {
    return {
      // retainContextWhenHidden: true,
      // Enable javascript in the webview
      enableScripts: true

      // And restrict the webview to only loading content from our extension's `dist` directory.
      // localResourceRoots: [
      //   vscode.Uri.joinPath(this.context.extensionUri, 'dist')
      // ]
    }
  }

  private createWebviewPanel(): WebviewPanel {
    return this._register(
      vscode.window.createWebviewPanel(
        PreviewPanel.ViewType,
        'Diagram preview',
        {
          viewColumn: vscode.ViewColumn.Beside,
          preserveFocus: true
        },
        this.getWebviewOptions()
      )
    )
  }

  private updateWebviewContent() {
    if (!this.panel) {
      throw new Error('PreviewPanel is not initialized')
    }
    const webview = this.panel.webview
    webview.options = this.getWebviewOptions()

    const extensionUri = this.context.extensionUri

    const nonce = getNonce()

    const stylesUri = getUri(webview, extensionUri, ['dist', 'preview', 'style.css'])
    const scriptUri = getUri(webview, extensionUri, ['dist', 'preview', 'index.js'])

    const cspSource = webview.cspSource
    webview.html = /*html*/ `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'none';
      style-src 'unsafe-inline' ${cspSource};
      img-src ${cspSource} https:;
      script-src 'nonce-${nonce}' ${cspSource};
    ">
    <link rel="stylesheet" type="text/css" href="${stylesUri}">
  </head>
  <body>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
  </body>
</html>`
  }
}
