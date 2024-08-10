/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { invariant, type ViewID } from '@likec4/core'
import { randomString } from 'remeda'
import * as vscode from 'vscode'
import { type Disposable, ViewColumn, type Webview, type WebviewPanel } from 'vscode'
import { logger } from '../../logger'
import { AbstractDisposable, disposable, getNonce } from '../../util'
import { ExtensionController } from '../ExtensionController'

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
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static current: PreviewPanel | undefined
  static ViewType = 'likec4-preview' as const

  public static Serializer = (props: {
    ctrl: ExtensionController
  }): vscode.WebviewPanelSerializer => ({
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
      logger.info(`[PreviewPanel.Serializer] deserializeWebviewPanel viewId=${viewId}`)
      PreviewPanel.revive({ ...props, panel, viewId })
      return Promise.resolve()
    }
  })

  public static createOrShow({ viewId, ctrl }: Props) {
    logger.debug(`[PreviewPanel] createOrShow viewId=${viewId}`)
    // If we already have a panel, show it.
    if (PreviewPanel.current) {
      PreviewPanel.current.open(viewId)
      PreviewPanel.current.panel.reveal()
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(PreviewPanel.ViewType, 'Diagram preview', {
      viewColumn: ViewColumn.Beside,
      preserveFocus: true
    }, {
      enableScripts: true
      // retainContextWhenHidden: true
    })
    ctrl.messenger.registerWebViewPanel(panel)
    PreviewPanel.current = new PreviewPanel(viewId, panel, ctrl)
  }

  public static revive({
    viewId,
    ctrl,
    panel
  }: Props & { panel: vscode.WebviewPanel }) {
    logger.debug(`[PreviewPanel] revive viewId=${viewId}`)
    invariant(!PreviewPanel.current, 'PreviewPanel is already initialized')
    ctrl.messenger.registerWebViewPanel(panel)
    PreviewPanel.current = new PreviewPanel(viewId, panel, ctrl)
  }

  private _listener: Disposable | null = null

  private constructor(
    private _viewId: ViewID,
    private readonly _panel: vscode.WebviewPanel,
    private readonly ctrl: ExtensionController
  ) {
    super()
    logger.debug(`[PreviewPanel] New panel viewId=${_viewId}`)
    // Set the webview's initial html content
    this._update()

    this.onDispose(() => {
      PreviewPanel.current = undefined
    })

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(
      () => {
        logger.debug(`[PreviewPanel.panel.onDidDispose]`)
        this.dispose()
      },
      this,
      this._disposables
    )

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      ({ webviewPanel }) => {
        logger.debug(
          `[PreviewPanel.panel.onDidChangeViewState] visible=${webviewPanel.visible}`
        )
        if (!webviewPanel.visible && this._listener != null) {
          this._deactivate()
          return
        }
      },
      this,
      this._disposables
    )

    this.onDispose(() => {
      this._deactivate()
      this._panel.dispose()
    })
  }

  get panel() {
    return this._panel
  }

  public override dispose() {
    super.dispose()
    logger.debug(`[PreviewPanel] disposed`)
  }

  public open(viewId?: ViewID) {
    logger.debug(`[PreviewPanel.panel] Open viewId=${viewId} (this.viewId=${this._viewId})`)
    if (viewId && viewId !== this._viewId) {
      this._viewId = viewId
      this._deactivate()
    }
    this._activate()
  }

  protected _activate() {
    if (this._listener) {
      this._deactivate()
    }
    const id = randomString(5) + '_' + this._viewId
    logger.debug(`[PreviewPanel.listener.${id}] activating...`)
    const subscribeToView = this.ctrl.c4model.subscribeToView(this._viewId, result => {
      if (result.success) {
        this._panel.title = result.diagram.title || 'Untitled'
        this.ctrl.messenger.diagramUpdate(result.diagram)
      } else {
        this.ctrl.messenger.sendError(result.error)
      }
    })
    this._listener = disposable(() => {
      subscribeToView.dispose()
      this._listener = null
      logger.debug(`[PreviewPanel.listener.${id}] disposed`)
    })
    logger.debug(`[PreviewPanel.listener.${id}] activated`)
  }

  private _deactivate() {
    if (this._listener) {
      this._listener.dispose()
    }
    logger.debug(`[PreviewPanel] _deactivated`)
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
    const internalState = this.ctrl.getPreviewPanelState()
    const nonce = getNonce()

    const stylesUri = getUri(webview, ['dist', 'preview', 'style.css'])
    const scriptUri = getUri(webview, ['dist', 'preview', 'index.js'])
    const theme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light'
    const cspSource = webview.cspSource
    webview.html = /*html*/ `
<!DOCTYPE html>
<html data-mantine-color-scheme="${theme}" style="color-scheme:${theme}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'none';
      font-src data: https: ${cspSource};
      style-src 'unsafe-inline' ${cspSource};
      img-src data: https: ${cspSource};
      script-src 'nonce-${nonce}' ${cspSource};
    ">
    <link rel="stylesheet" type="text/css" href="${stylesUri}">
  </head>
  <body class="${theme}">
    <script nonce="${nonce}">
      var __INTERNAL_STATE = ${JSON.stringify({ internalState })};
    </script>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
  </body>
</html>`
  }
}
