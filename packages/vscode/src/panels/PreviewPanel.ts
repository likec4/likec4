/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type { Fqn, RelationID, ViewID, DiagramView } from '@likec4/core/types'
import * as vscode from 'vscode'
import type { Disposable, Webview, WebviewPanel } from 'vscode'
import { ADisposable, getNonce } from '$/util'
import type { ExtensionContext, C4Model, LanguageClient } from '$/di'
import { di } from '$/di'
import { tokens } from 'typed-inject'
import type { PanelToExtensionProtocol } from '@likec4/vscode-preview/protocol'
import type { Location } from 'vscode-languageserver-protocol'
import { locateElement, locateRelation, locateView } from '@likec4/language-server/protocol'

function getUri(webview: Webview, extensionUri: vscode.Uri, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList))
}

export class PreviewPanel extends ADisposable implements vscode.WebviewPanelSerializer {

  private panel: WebviewPanel | null = null
  private listener: Disposable | null = null
  private currentViewId: ViewID | null = null

  static ViewType = 'likec4-preview' as const
  static inject = tokens(di.c4model, di.client, di.context)
  constructor(
    private c4model: C4Model,
    private client: LanguageClient,
    private context: ExtensionContext,
  ) {
    super()
  }

  deserializeWebviewPanel(webviewPanel: WebviewPanel, _state: any) {
    this.currentViewId = null
    this.setupPanel(webviewPanel)
    return Promise.resolve()
  }

  public open(viewId: ViewID) {
    console.log('open', { this: this, viewId })
    if (this.panel) {
      this.panel.reveal(undefined, true)
      this.subscribeToModel(viewId)
      return
    }

    this.currentViewId = viewId
    this.setupPanel(this.createWebviewPanel())
    // Subscribe to model happends on "ready" from webview
    // this.subscribeToModel(viewId)
  }

  private subscribeToModel(viewId: ViewID) {
    this.listener?.dispose()
    this.currentViewId = viewId
    this.listener = this.c4model.subscribeToView(viewId, (data) => {
      this.sendUpdate(data)
    })
  }

  private setupPanel(panel: WebviewPanel) {
    if (this.panel) {
      throw new Error('PreviewPanel is initialized')
    }
    this.panel = panel

    panel.webview.onDidReceiveMessage(
      this.onWebviewMessage,
      this,
      this._disposables
    )

    panel.onDidDispose(
      () => {
        console.log('panel.onDidDispose')
        this.panel = null
        this.close()
      },
      this,
      this._disposables
    )

    this.updateWebviewContent()
  }

  private close() {
    this.listener?.dispose()
    this.listener = null
    this.panel?.dispose()
    this.panel = null
    this.currentViewId = null
  }

  private sendUpdate(view: DiagramView) {
    if (!this.panel) {
      console.warn('sendUpdate: panel is not initialized')
      return
    }
    if (!this.panel.visible) {
      console.debug('ignore sendUpdate: panel is not visible')
      return
    }
    this.panel.title = view.title ?? 'Untitled'
    void this.panel.webview.postMessage({
      kind: 'update',
      view
    }).then(
      (posted) => {
        if (!posted) {
          console.warn('sendUpdate: message not posted')
        }
      },
      (err) => console.error(err)
    )
  }

  private goToSource = async (element: Fqn) => {
    const loc = await this.client.sendRequest(locateElement, { element })
    if (loc) {
      await this.goToLocation(loc)
    }
  }

  private goToRelation = async (id: RelationID) => {
    const loc = await this.client.sendRequest(locateRelation, { id })
    if (loc) {
      await this.goToLocation(loc)
    }
  }

  private goToViewSource = async (id: ViewID) => {
    const loc = await this.client.sendRequest(locateView, { id })
    if (loc) {
      await this.goToLocation(loc)
    }
  }

  private goToLocation = async (loc: Location) => {
    const panelViewColumn = this.panel?.viewColumn ?? vscode.ViewColumn.Two
    const uri = vscode.Uri.parse(loc.uri)
    const range = new vscode.Range(
      loc.range.start.line,
      loc.range.start.character,
      loc.range.end.line,
      loc.range.end.character
    )
    await vscode.window.showTextDocument(uri, {
      viewColumn: (panelViewColumn !== vscode.ViewColumn.One) ? vscode.ViewColumn.One : panelViewColumn,
      selection: range
    })
  }

  private onWebviewMessage = (message: PanelToExtensionProtocol) => {
    console.log(`from webview: ${message.kind}`, message )
    switch (message.kind) {
      case 'close': {
        this.close()
        return
      }
      case 'ready': {
        if (this.currentViewId) {
          this.subscribeToModel(this.currentViewId)
        } else {
          console.warn('ready: currentViewId is not set')
        }
        return
      }
      case 'open': {
        this.open(message.viewId)
        return
      }
      case 'goToRelationSource': {
        void this.goToRelation(message.relationId)
        return
      }
      case 'goToElementSource': {
        void this.goToSource(message.element)
        return
      }
      case 'goToViewSource': {
        void this.goToViewSource(message.viewId)
        return
      }
    }
    // @ts-expect-error - exhaustive switch
    throw new Error(`Unexchaustive switch for ${message.kind}`)
  }

  private getWebviewOptions(): vscode.WebviewOptions {
    return {
      // Enable javascript in the webview
      enableScripts: true,

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
    webview.html = /*html*/`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'none';
      style-src 'unsafe-inline' ${cspSource};
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
