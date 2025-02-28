import { type ViewId, nonNullable } from '@likec4/core'
import { BroadcastModelUpdate, GetLastClickedNode, OnOpenView } from '@likec4/vscode-preview/protocol'
import {
  type EffectScope,
  computed,
  createSingletonComposable,
  effectScope,
  extensionContext,
  ref,
  toValue,
  useDisposable,
  useIsDarkTheme,
  useViewTitle,
  watch,
} from 'reactive-vscode'
import { type Webview, type WebviewPanel, Uri, ViewColumn, window } from 'vscode'
import { isProd } from '../const'
import { logger as rootLogger } from '../logger'
import { computedModel } from '../state'
import { useMessenger } from './useMessenger'

export const ViewType = 'likec4-preview' as const

const logger = rootLogger.getChild('DiagramPreview')

export const useDiagramPreview = createSingletonComposable(() => {
  let current: ReturnType<typeof createDiagramPreview> | null
  let currentScope: EffectScope | null = null

  function close() {
    if (current) {
      logger.debug`close ${toValue(current.viewId)}`
    }
    currentScope?.stop()
    current = currentScope = null
  }

  function ensureCurrent(initialViewId: string) {
    if (!current) {
      currentScope = effectScope()
      current = nonNullable(
        currentScope.run(() => createDiagramPreview(initialViewId)),
        'failed to create diagram preview panel',
      )
      current.panel.onDidDispose(close)
    }
    return current
  }

  function open(viewId: string) {
    const { panel, visible, viewId: currentViewId } = ensureCurrent(viewId)
    currentViewId.value = viewId
    if (visible.value !== true) {
      panel.reveal()
    }
  }

  function deserialize(panel: WebviewPanel, state: { viewId?: string }) {
    logger.debug`deserialize ${state.viewId}`
    close()
    currentScope = effectScope()
    current = nonNullable(
      currentScope.run(() => createDiagramPreview(state.viewId ?? 'index', () => panel)),
      'failed to deserialize diagram preview panel',
    )
    current.panel.onDidDispose(close)
    panel.reveal()
  }

  return {
    open,
    close,
    viewId: () => current?.viewId.value as ViewId | null ?? null,
    getLastClickedElement: async () => {
      if (!current) {
        return {
          element: null,
          deployment: null,
        }
      }
      return await current.getLastClickedElement()
    },
    deserialize,
  }
})

type CreatePanel = () => WebviewPanel
const defaultCreatePanel: CreatePanel = () => {
  return useDisposable(window.createWebviewPanel(
    ViewType,
    'Diagram Preview',
    {
      viewColumn: ViewColumn.Beside,
      preserveFocus: true,
    },
    {
      enableScripts: true,
    },
  ))
}

function createDiagramPreview(initialViewId: string, createPanel = defaultCreatePanel) {
  logger.debug`createDiagramPreview ${initialViewId}`
  const messenger = useMessenger()
  const viewId = ref(initialViewId)

  const panel = createPanel()

  const title = computed(() => {
    return computedModel.value?.views[viewId.value]?.title ?? 'Diagram Preview'
  })

  useViewTitle(panel, title)
  const _visible = ref(panel.visible)
  useDisposable(panel.onDidChangeViewState(() => {
    _visible.value = panel.visible
  }))
  const visible = computed(() => _visible.value)

  const internalState = {
    edgesEditable: true,
    nodesDraggable: true,
  }
  const nonce = getNonce()

  const stylesUri = getUri(panel.webview, ['dist', 'preview', 'style.css'])
  const scriptUri = getUri(panel.webview, ['dist', 'preview', 'index.js'])
  const theme = useIsDarkTheme().value ? 'dark' : 'light'
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
<html data-mantine-color-scheme="${theme}" style="color-scheme:${theme}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
    <meta http-equiv="Content-Security-Policy" content="${cspDirectives.join(' ')}">
    <link rel="stylesheet" type="text/css" href="${stylesUri}" nonce="${nonce}">
  </head>
  <body class="${theme}">
    <script nonce="${nonce}">
      var __VIEW_ID = ${JSON.stringify(initialViewId)};
      var __INTERNAL_STATE = ${JSON.stringify({ internalState })};
    </script>
    <div id="root" nonce="${nonce}"></div>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>`

  const participantId = messenger.registerWebviewPanel(panel, {
    broadcastMethods: [BroadcastModelUpdate.method],
  })
  watch(viewId, (viewId) => {
    logger.debug`sendNotification ${'OpenView ' + viewId}`
    messenger.sendNotification(OnOpenView, participantId, { viewId })
  })
  return {
    viewId,
    panel,
    visible,
    getLastClickedElement: async () => {
      return await messenger.sendRequest(GetLastClickedNode, participantId)
    },
  }
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
