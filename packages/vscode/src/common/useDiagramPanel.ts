import type { ProjectId, ViewId } from '@likec4/core/types'
import { BroadcastModelUpdate, GetLastClickedNode, OnOpenView } from '@likec4/vscode-preview/protocol'
import {
  type EffectScope,
  computed,
  createSingletonComposable,
  effectScope,
  extensionContext,
  nextTick,
  ref,
  shallowRef,
  triggerRef,
  tryOnScopeDispose,
  useDisposable,
  useIsDarkTheme,
  useViewTitle,
  watch,
} from 'reactive-vscode'
import * as v from 'valibot'
import { type Webview, type WebviewPanel, Uri, ViewColumn, window } from 'vscode'
import type { WebviewIdMessageParticipant } from 'vscode-messenger-common'
import { isProd } from '../const'
import { logError, logger as rootLogger } from '../logger'
import { computedModels } from '../state'
import { useMessenger } from './useMessenger'

const serializeStateSchema = v.looseObject({
  viewId: v.pipe(v.string(), v.minLength(1)),
  projectId: v.pipe(v.string(), v.minLength(1)),
})

export const ViewType = 'likec4-preview' as const

const logger = rootLogger.getChild('diagram-panel')

export const useDiagramPanel = createSingletonComposable(() => {
  const panel = shallowRef<WebviewPanel | null>(null)
  const panelVisible = ref(false)
  let panelScope: EffectScope | null = null

  const panelState = {
    viewId: ref<ViewId | null>(null),
    projectId: ref<ProjectId | null>(null),
  }

  // vscode-messenger participant id
  const participantId = ref<WebviewIdMessageParticipant | null>(null)

  function runInPanelScope() {
    const viewId = (panelState.viewId.value ?? 'index') as ViewId
    const projectId = (panelState.projectId.value ?? 'default') as ProjectId
    const messenger = useMessenger()
    const panelExists = panel.value !== null
    const _panel = panel.value ??= useDisposable(createWebviewPanel())

    panelVisible.value = _panel.visible

    _panel.onDidDispose(() => {
      // if panel is not disposed by close() call, call close() to dispose it
      if (panel.value) {
        logger.debug`panel closed by user`
        panel.value = null
        close()
      }
    })
    useDisposable(_panel.onDidChangeViewState((e) => {
      if (panelVisible.value !== e.webviewPanel.visible) {
        panelVisible.value = e.webviewPanel.visible
        logger.debug`panel visible changed: ${e.webviewPanel.visible}`
        triggerRef(panel)
      }
    }))
    writeHTMLToDiagramPreview(_panel, viewId, projectId)

    const participant = participantId.value = messenger.registerWebviewPanel(_panel, {
      broadcastMethods: [BroadcastModelUpdate.method],
    })

    watch([panelState.viewId, panelState.projectId], ([viewId, projectId]) => {
      if (!viewId) {
        logger.warn('Invalid state: viewId is empty in ensurePanel scope')
        return
      }
      if (!projectId) {
        logger.warn('Invalid state: projectId is empty in ensurePanel scope')
        return
      }
      logger.debug`sendNotification ${'OpenView ' + viewId} from ${projectId}`
      messenger.sendNotification(OnOpenView, participant, {
        projectId,
        viewId,
      })
    })

    if (panelExists) {
      nextTick(() => {
        logger.debug`panel exists, sending OpenView notification`
        logger.debug`sendNotification ${'OpenView ' + viewId} from ${projectId}`
        messenger.sendNotification(OnOpenView, participant, {
          projectId,
          viewId,
        })
      })
    }

    tryOnScopeDispose(() => {
      panelVisible.value = false
      participantId.value = null
    })
  }

  /**
   * Ensures that the panel scope is created and runs the panel scope.
   * If the panel scope is not created, it will be created and run.
   * If the panel scope is created but the panel is null, it will be disposed and re-run.
   */
  function ensurePanelScope() {
    if (!panelScope) {
      logger.debug`creating scope for view ${panelState.viewId.value} (project: ${panelState.projectId.value})`
      panelScope = effectScope()
      panelScope.run(() => {
        try {
          runInPanelScope()
        } catch (err) {
          logger.error('Error in panel scope', { err })
        }
      })
      return panel
    }
    if (!panel.value) {
      logger.error('Invalid state: panel is null in ensurePanel with active scope')
      panelScope.stop()
      panelScope = null
      return ensurePanelScope()
    }
    return panel
  }

  useViewTitle(
    panel,
    computed(() => {
      const viewId = panelState.viewId.value
      const projectId = panelState.projectId.value
      if (!viewId || !projectId) {
        return 'Diagram Preview'
      }
      const view = computedModels.value[projectId]?.views[viewId]
      if (!view) {
        return 'Diagram Preview'
      }
      return view.title ?? `Preview ${view.id}`
    }),
  )

  function open(viewId: ViewId, projectId: ProjectId) {
    logger.debug`open view ${viewId} (project: ${projectId})`
    const panelExists = panel.value !== null
    panelState.viewId.value = viewId
    panelState.projectId.value = projectId
    ensurePanelScope()
    if (panelExists) {
      panel.value?.reveal(undefined, true)
    }
  }

  function close() {
    try {
      const _panel = panel.value
      // reset panel value to null to prevent dispose loop
      panel.value = null
      if (_panel) {
        logger.debug`close view ${panelState.viewId.value} (project: ${panelState.projectId.value})`
        _panel.dispose()
      }
      panelScope?.stop()
    } catch (e) {
      logError(e)
    } finally {
      panelScope = null
      panelState.viewId.value = null
      panelState.projectId.value = null
    }
  }

  function deserialize(_panel: WebviewPanel, serializeState: any) {
    try {
      const parsedState = v.safeParse(serializeStateSchema, serializeState)
      if (!parsedState.success) {
        logger.error('Invalid serialized state', { serializeState, issues: v.flatten(parsedState.issues) })
        _panel.dispose()
        return
      }
      close()
      panel.value = _panel
      panelState.viewId.value = parsedState.output.viewId as ViewId
      panelState.projectId.value = parsedState.output.projectId as ProjectId
      ensurePanelScope()
      _panel.reveal(undefined, true)
    } catch (e) {
      logError(e)
    }
  }

  tryOnScopeDispose(() => {
    close()
  })

  return {
    open,
    close,
    viewId: computed(() => panelState.viewId.value),
    projectId: computed(() => panelState.projectId.value),
    visible: computed(() => panelVisible.value),
    deserialize,
    getLastClickedElement: async () => {
      if (participantId.value) {
        return await useMessenger().sendRequest(GetLastClickedNode, participantId.value)
      }
      return {
        element: null,
        deployment: null,
      }
    },
  }
})
export type DiagramPanel = ReturnType<typeof useDiagramPanel>

function createWebviewPanel() {
  return window.createWebviewPanel(
    ViewType,
    'Diagram Preview',
    {
      viewColumn: ViewColumn.Beside,
      preserveFocus: true,
    },
    {
      enableScripts: true,
    },
  )
}

function writeHTMLToDiagramPreview(
  panel: WebviewPanel,
  viewId: ViewId,
  projectId: ProjectId,
) {
  logger.debug`writeHTMLToDiagramPreview ${viewId} (project: ${projectId})`
  const internalState = {
    edgesEditable: true,
    nodesDraggable: true,
  }
  panel.webview.options = {
    enableScripts: true,
    enableCommandUris: true,
  }
  const nonce = getNonce()

  const stylesUri = getUri(panel.webview, ['dist', 'preview', 'index.css'])
  const scriptUri = getUri(panel.webview, ['dist', 'preview', 'index.js'])
  // const isDarkTheme = useIsDarkTheme()
  const theme = computed(() => useIsDarkTheme().value ? 'dark' : 'light')
  const cspSource = panel.webview.cspSource.replaceAll('"', '\'')
  const cspDirectives = [
    `default-src 'none';`,
    `font-src ${cspSource} data: https: 'nonce-${nonce}';`,
    isProd ? `style-src ${cspSource} 'nonce-${nonce}';` : `style-src ${cspSource} 'unsafe-inline';`,
    `img-src ${cspSource} data: https:;`,
    `script-src 'nonce-${nonce}';`,
  ]

  watch(theme, (_theme) => {
    panel.webview.html = /*html*/ `
<!DOCTYPE html>
<html data-mantine-color-scheme="${_theme}" style="color-scheme:${_theme}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
    <meta http-equiv="Content-Security-Policy" content="${cspDirectives.join(' ')}">
    <link rel="stylesheet" type="text/css" href="${stylesUri}" nonce="${nonce}">
  </head>
  <body class="${theme.value}">
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
