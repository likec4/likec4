import { delay, invariant, type ViewID } from '@likec4/core'
import * as vscode from 'vscode'
import { ViewColumn, type Webview, type WebviewPanel } from 'vscode'
import { isProd } from '../const'
import { ExtensionController } from '../ExtensionController'
import { logger } from '../logger'
import type { DirectToWebviewProtocol } from '../Messenger'
import { AbstractDisposable, getNonce } from '../util'

function getUri(webview: Webview, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(ExtensionController.extensionUri, ...pathList))
}
type Props = {
  viewId: ViewID
  ctrl: ExtensionController
}

export type PreviewPanelInternalState = {
  nodesDraggable: boolean
  edgesEditable: boolean
}

export class PreviewPanel extends AbstractDisposable {
  /**
   * Track the currently webview. Only allow a single webview to exist at a time.
   */
  public static current: PreviewPanel | undefined
  public static readonly ViewType = 'likec4-preview' as const

  public static createOrReveal({ viewId, ctrl }: Props) {
    // If we already have a webview, show it.
    if (PreviewPanel.current) {
      logger.debug(`[PreviewPanel] reveal viewId=${viewId}`)
      PreviewPanel.current.open(viewId)
      return
    }
    logger.debug(`[PreviewPanel] create viewId=${viewId}`)

    // Otherwise, create a new webview.
    const panel = vscode.window.createWebviewPanel(PreviewPanel.ViewType, 'Diagram preview', {
      viewColumn: ViewColumn.Beside,
      preserveFocus: true
    }, {
      enableScripts: true,
      retainContextWhenHidden: false
    })
    PreviewPanel.current = new PreviewPanel(viewId, panel, ctrl)
  }

  public rpc: DirectToWebviewProtocol

  constructor(
    private _viewId: ViewID,
    public readonly panel: vscode.WebviewPanel,
    ctrl: ExtensionController
  ) {
    super()
    this.rpc = ctrl.messenger.registerWebViewPanel(panel)
    logger.debug(`[PreviewPanel] New panel viewId=${_viewId}`)
    // Set the webview's initial html content
    this._update()

    this.onDispose(() => {
      PreviewPanel.current = undefined
      this.panel.dispose()
    })

    // Listen for when the webview is disposed
    // This happens when the user closes the webview or when the webview is closed programmatically
    this.panel.onDidDispose(
      () => {
        logger.debug(`[PreviewPanel.panel.onDidDispose]`)
        this.dispose()
      },
      this,
      this._disposables
    )
  }

  public open(viewId: ViewID) {
    this.panel.reveal()
    if (this._viewId !== viewId) {
      this.rpc.notifyToChangeView(viewId)
      this._viewId = viewId
    }
  }

  private _update() {
    const webview = this.panel.webview
    webview.options = {
      // retainContextWhenHidden: true,
      // Enable javascript in the webview
      enableScripts: true,
      localResourceRoots: [
        ExtensionController.context.extensionUri
      ]
    }
    // const internalState = this.ctrl.getPreviewPanelState()
    const internalState = {
      edgesEditable: true,
      nodesDraggable: true
    }
    const nonce = getNonce()

    const stylesUri = getUri(webview, ['dist', 'preview', 'style.css'])
    const scriptUri = getUri(webview, ['dist', 'preview', 'index.js'])
    const theme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light'
    const cspSource = webview.cspSource.replaceAll('"', '\'')
    const cspDirectives = [
      `default-src 'none';`,
      `font-src ${cspSource} data: https: 'nonce-${nonce}';`,
      isProd ? `style-src ${cspSource} 'nonce-${nonce}';` : `style-src ${cspSource} 'unsafe-inline';`,
      `img-src ${cspSource} data: https:;`,
      `script-src 'nonce-${nonce}';`
    ]
    webview.html = /*html*/ `
<!DOCTYPE html>
<html data-mantine-color-scheme="${theme}" style="color-scheme:${theme}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
    <meta http-equiv="Content-Security-Policy" content="${cspDirectives.join(' ')}">
    <link rel="stylesheet" type="text/css" href="${stylesUri}" nonce="${nonce}">
  </head>
  <body class="${theme}">
    <script nonce="${nonce}">
      var __VIEW_ID = ${JSON.stringify(this._viewId)};
      var __INTERNAL_STATE = ${JSON.stringify({ internalState })};
    </script>
    <div id="root" nonce="${nonce}"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`
  }
}

export namespace PreviewPanel {
  export class Serializer implements vscode.WebviewPanelSerializer {
    constructor(
      private readonly ctrl: ExtensionController
    ) {}

    async deserializeWebviewPanel(panel: WebviewPanel, state: unknown): Promise<void> {
      invariant(!PreviewPanel.current, 'PreviewPanel already initialized')
      let viewId: ViewID
      if (
        state != null
        && typeof state === 'object'
        && 'view' in state
        && state.view != null
        && typeof state.view === 'object'
        && 'id' in state.view
        && typeof state.view.id === 'string'
      ) {
        viewId = state.view.id as ViewID
      } else {
        viewId = 'index' as ViewID
      }
      logger.info(`[PreviewPanel.Serializer] deserializeWebviewPanel viewId=${viewId}`)
      PreviewPanel.current = new PreviewPanel(viewId, panel, this.ctrl)
      await delay(500)
      panel.reveal()
    }
  }
}
