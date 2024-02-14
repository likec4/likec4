/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { invariant, type ViewID } from '@likec4/core'
import { random } from 'rambdax'
import * as vscode from 'vscode'
import { type Disposable, ViewColumn, type Webview, type WebviewPanel } from 'vscode'
import { Logger } from '../../logger'
import { AbstractDisposable, disposable, getNonce } from '../../util'
import type { C4Model } from '../C4Model'
import { ExtensionController } from '../ExtensionController'
import type Messenger from '../Messenger'

function getUri(webview: Webview, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(ExtensionController.extensionUri, ...pathList))
}
type Props = {
  viewId: ViewID
  messenger: Messenger
  c4model: C4Model
}

export class PreviewPanel extends AbstractDisposable {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static current: PreviewPanel | undefined
  static ViewType = 'likec4-preview' as const

  public static Serializer = (props: Omit<Props, 'viewId'>): vscode.WebviewPanelSerializer => ({
    deserializeWebviewPanel(panel: WebviewPanel, state: unknown): Thenable<void> {
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
      PreviewPanel.revive({ ...props, panel, viewId })
      return Promise.resolve()
    }
  })

  public static createOrShow({ viewId, messenger, c4model }: Props) {
    Logger.debug(`[Extension.PreviewPanel] createOrShow viewId=${viewId}`)
    // If we already have a panel, show it.
    if (PreviewPanel.current) {
      PreviewPanel.current.open(viewId)
      PreviewPanel.current.panel.reveal()
      return
    }

    let viewColumn = vscode.window.activeTextEditor?.viewColumn ?? ViewColumn.One
    viewColumn = viewColumn === ViewColumn.One ? ViewColumn.Beside : viewColumn

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(PreviewPanel.ViewType, 'Diagram preview', {
      viewColumn,
      preserveFocus: true
    })
    messenger.registerWebViewPanel(panel)
    PreviewPanel.current = new PreviewPanel(viewId, panel, messenger, c4model)
  }

  public static revive({
    viewId,
    panel,
    messenger,
    c4model
  }: Props & { panel: vscode.WebviewPanel }) {
    Logger.debug(`[Extension.PreviewPanel] revive viewId=${viewId}`)
    invariant(!PreviewPanel.current, 'PreviewPanel is already initialized')
    messenger.registerWebViewPanel(panel)
    PreviewPanel.current = new PreviewPanel(viewId, panel, messenger, c4model)
  }

  private _listener: Disposable | null = null

  private constructor(
    private _viewId: ViewID,
    private readonly _panel: vscode.WebviewPanel,
    private readonly messenger: Messenger,
    private readonly c4model: C4Model
  ) {
    super()
    // Set the webview's initial html content
    this._update()

    this.onDispose(() => {
      PreviewPanel.current = undefined
    })

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(
      () => {
        Logger.debug(`[Extension.PreviewPanel.panel.onDidDispose]`)
        this.dispose()
      },
      this,
      this._disposables
    )

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      ({ webviewPanel }) => {
        Logger.debug(
          `[Extension.PreviewPanel.panel.onDidChangeViewState] visible=${webviewPanel.visible}`
        )
        if (!webviewPanel.visible && this._listener) {
          this._deactivate()
        }
      },
      this,
      this._disposables
    )

    this.onDispose(() => {
      this._panel.dispose()
    })

    this.onDispose(() => {
      this._deactivate()
    })
  }

  get panel() {
    return this._panel
  }

  public override dispose() {
    super.dispose()
    Logger.debug(`[Extension.PreviewPanel] disposed`)
  }

  public open(viewId?: ViewID) {
    this._deactivate()
    if (viewId && viewId !== this._viewId) {
      this._viewId = viewId
    }
    this._activate()
  }

  protected _activate() {
    if (this._listener) {
      Logger.warn(`[Extension.PreviewPanel] _activate: already activated`)
      this._deactivate()
    }
    const subscribeToView = this.c4model.subscribeToView(this._viewId, result => {
      if (result.success) {
        this._panel.title = result.diagram.title || 'Untitled'
        this.messenger.diagramUpdate(result.diagram)
      } else {
        this.messenger.sendError(result.error)
      }
    })
    const id = '' + random(1000, 9999) + '_' + this._viewId
    this._listener = disposable(() => {
      subscribeToView.dispose()
      this._listener = null
      Logger.debug(`[Extension.PreviewPanel.listener.${id}] disposed`)
    })
    Logger.debug(`[Extension.PreviewPanel] _activated`)
  }

  private _deactivate() {
    if (this._listener) {
      this._listener.dispose()
      Logger.debug(`[Extension.PreviewPanel] _deactivated`)
    }
  }

  private _update() {
    const webview = this._panel.webview
    webview.options = {
      // retainContextWhenHidden: true,
      // Enable javascript in the webview
      enableScripts: true
      // And restrict the webview to only loading content from our extension's `dist` directory.
      // localResourceRoots: [
      //   vscode.Uri.joinPath(this.context.extensionUri, 'dist')
      // ]
    }

    const nonce = getNonce()

    const stylesUri = getUri(webview, ['dist', 'preview', 'style.css'])
    const scriptUri = getUri(webview, ['dist', 'preview', 'index.js'])

    const cspSource = webview.cspSource
    webview.html = /*html*/ `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'none';
      font-src https://fonts.googleapis.com https://fonts.gstatic.com ${cspSource};
      style-src 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${cspSource};
      img-src ${cspSource} https:;
      script-src 'nonce-${nonce}' ${cspSource};
    ">
    <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&display=swap"
      rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="${stylesUri}">
  </head>
  <body>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
  </body>
</html>`
  }
}
