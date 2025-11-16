import type { ProjectId, ViewId } from '@likec4/core'
import { computed, extensionContext, useIsDarkTheme, watch } from 'reactive-vscode'
import { type Webview, type WebviewPanel, Uri } from 'vscode'
import { isProd } from '../const'

export function writeHTMLToWebview(
  panel: WebviewPanel,
  viewId: ViewId,
  projectId: ProjectId,
) {
  const internalState = {
    edgesEditable: true,
    nodesDraggable: true,
  }
  panel.webview.options = {
    enableScripts: true,
    enableCommandUris: true,
  }
  const isDarkTheme = useIsDarkTheme()
  const theme = computed(() => isDarkTheme.value ? 'dark' : 'light')

  watch(theme, (_theme) => {
    const stylesUri = getUri(panel.webview, ['dist', 'preview', 'index.css'])
    const scriptUri = getUri(panel.webview, ['dist', 'preview', 'index.js'])
    const nonce = getNonce()
    const cspSource = panel.webview.cspSource.replaceAll('"', '\'')
    const cspDirectives = [
      `default-src 'none';`,
      `font-src ${cspSource} data: https: 'nonce-${nonce}';`,
      isProd ? `style-src ${cspSource} 'nonce-${nonce}';` : `style-src ${cspSource} 'unsafe-inline';`,
      `img-src ${cspSource} data: https:;`,
      `script-src 'nonce-${nonce}';`,
    ]
    panel.webview.html = /*html*/ `
<!DOCTYPE html>
<html data-mantine-color-scheme="${_theme}" style="color-scheme:${_theme}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
    <meta http-equiv="Content-Security-Policy" content="${cspDirectives.join(' ')}">
    <link rel="stylesheet" type="text/css" href="${stylesUri}" nonce="${nonce}">
  </head>
  <body class="${_theme}">
    <script nonce="${nonce}">
      var __VIEW_ID = ${JSON.stringify(viewId)};
      var __PROJECT_ID = ${JSON.stringify(projectId)};
      var __INTERNAL_STATE = ${JSON.stringify({ internalState })};
    </script>
    <div id="root" nonce="${nonce}"></div>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>`
  }, {
    immediate: true,
  })
}

function getUri(webview: Webview, pathList: string[]) {
  return webview.asWebviewUri(Uri.joinPath(extensionContext.value!.extensionUri, ...pathList))
}

/**
 * @description Generates the randomized nonce for the webview (embedded preview).
 * @returns 16-long randomized nonce.
 */
function getNonce(): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 16; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
