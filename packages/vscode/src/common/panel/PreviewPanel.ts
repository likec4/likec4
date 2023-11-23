/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  nonexhaustive,
  type DiagramView,
  type Fqn,
  type RelationID,
  type ViewID,
  normalizeError
} from '@likec4/core'
import type {
  ExtensionToPanelProtocol,
  PanelToExtensionProtocol
} from '@likec4/vscode-preview/protocol'
import type { Disposable, Webview, WebviewPanel } from 'vscode'
import * as vscode from 'vscode'
import type { Location } from 'vscode-languageclient'
import { Logger, logError } from '../../logger'
import { AbstractDisposable, getNonce } from '../../util'
import type { C4Model } from '../C4Model'
import type { Rpc } from '../Rpc'

function getUri(webview: Webview, extensionUri: vscode.Uri, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList))
}

export class PreviewPanel extends AbstractDisposable implements vscode.WebviewPanelSerializer {
  private panel: WebviewPanel | null = null
  private listener: Disposable | null = null
  private currentViewId: ViewID | null = null

  static ViewType = 'likec4-preview' as const

  constructor(
    private c4model: C4Model,
    private rpc: Rpc,
    private context: vscode.ExtensionContext
  ) {
    super()

    this.onDispose(() => {
      this.unsubscribe()
      this.panel?.dispose()
    })
  }

  public override dispose() {
    super.dispose()
    Logger.debug(`[Extension.PreviewPanel] disposed`)
  }

  deserializeWebviewPanel(webviewPanel: WebviewPanel, state: unknown) {
    try {
      this.currentViewId = null
      if (this.panel) {
        const err = new Error('PreviewPanel is already initialized')
        logError(err)
        return Promise.reject(err)
      }
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
      this.panel = webviewPanel
      this.initPanel()
      return Promise.resolve()
    } catch (e) {
      Logger.error(normalizeError(e))
      return Promise.reject(e)
    }
  }

  public open(viewId: ViewID) {
    Logger.debug(`[Extension.PreviewPanel] open ${viewId}`)
    if (this.panel) {
      this.panel.reveal(undefined, true)
      this.subscribeToModel(viewId)
      return
    }
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
    if (this.listener) {
      Logger.debug(`[Extension.PreviewPanel] unsubscribe`)
      this.listener.dispose()
      this.listener = null
    }
  }

  private initPanel() {
    if (!this.panel) {
      throw new Error('PreviewPanel is not initialized')
    }

    this.panel.webview.onDidReceiveMessage(this.onWebviewMessage)

    this.panel.onDidChangeViewState(({ webviewPanel }) => {
      Logger.debug(
        `[Extension.PreviewPanel.panel] onDidChangeViewState visible=${webviewPanel.visible}`
      )
      if (!webviewPanel.visible) {
        this.unsubscribe()
      }
    })

    this.panel.onDidDispose(() => {
      Logger.debug(`[Extension.PreviewPanel.panel] onDidDispose`)
      this.panel = null
      this.close()
    })

    this.updateWebviewContent()
  }

  public onContextMenuOpenSource() {
    this.sendToPanel({
      kind: 'onContextMenuOpenSource'
    })
  }

  private close() {
    Logger.debug(`[Extension.PreviewPanel] close`)
    // this.telemetry.sendTelemetryEvent('PreviewPanel.close')
    this.unsubscribe()
    this.panel?.dispose()
    this.panel = null
    this.currentViewId = null
  }

  private sendUpdate(view: DiagramView | null) {
    if (this.panel && view) {
      this.panel.title = view.title ?? 'Untitled'
    }
    const msg = (
      view
        ? {
            kind: 'update',
            view
          }
        : {
            kind: 'error'
          }
    ) satisfies ExtensionToPanelProtocol
    this.sendToPanel(msg)
  }

  private sendToPanel(message: ExtensionToPanelProtocol) {
    if (!this.panel) {
      Logger.warn(`[Extension.PreviewPanel] sendToPanel failed, panel is not initialized`)
      this.unsubscribe()
      return
    }
    if (!this.panel.visible) {
      Logger.debug(`[Extension.PreviewPanel] sendToPanel ignore, panel is not visible`)
      return
    }
    void this.panel.webview.postMessage(message).then(
      posted => {
        if (!posted) {
          Logger.warn('[Extension.PreviewPanel] sendToPanel: message not posted')
        }
      },
      err => logError(err)
    )
  }

  private goToSource = async (element: Fqn) => {
    return await this.rpc.locate({ element })
  }

  private goToRelation = async (relation: RelationID) => {
    return await this.rpc.locate({ relation })
  }

  private goToViewSource = async (view: ViewID) => {
    return await this.rpc.locate({ view })
  }

  private goToLocation = async (loc: Location | null) => {
    if (!loc) {
      return
    }
    const panelViewColumn = this.panel?.viewColumn ?? vscode.ViewColumn.Two
    const location = this.rpc.client.protocol2CodeConverter.asLocation(loc)
    await vscode.window.showTextDocument(location.uri, {
      viewColumn:
        panelViewColumn !== vscode.ViewColumn.One ? vscode.ViewColumn.One : panelViewColumn,
      selection: location.range
    })
  }

  private onWebviewMessage = (message: PanelToExtensionProtocol) => {
    Logger.debug(`[Extension.PreviewPanel] from webview: ${message.kind}`)
    switch (message.kind) {
      case 'close': {
        this.close()
        return
      }
      case 'ready': {
        if (this.currentViewId) {
          this.subscribeToModel(this.currentViewId)
        } else {
          Logger.warn('[Extension.PreviewPanel] on ready: currentViewId is not set')
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
      default: {
        return nonexhaustive(message)
      }
    }
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
    return vscode.window.createWebviewPanel(
      PreviewPanel.ViewType,
      'Diagram preview',
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true
      },
      this.getWebviewOptions()
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
