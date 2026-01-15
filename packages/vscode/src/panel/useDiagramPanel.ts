import { invariant } from '@likec4/core'
import type { ProjectId, ViewId } from '@likec4/core/types'
import {
  type EffectScope,
  computed,
  createSingletonComposable,
  effectScope,
  nextTick,
  readonly,
  ref,
  tryOnScopeDispose,
  useDisposable,
  useViewTitle,
  watch,
} from 'reactive-vscode'
import { type WebviewPanel, ViewColumn, window } from 'vscode'
import type { WebviewIdMessageParticipant } from 'vscode-messenger-common'
import * as z from 'zod/v4'
import { useExtensionLogger } from '../useExtensionLogger'
import { useMessenger } from '../useMessenger'
import { useRpc } from '../useRpc'
import { writeHTMLToWebview } from './writeHTMLToWebview'

const serializeStateSchema = z.looseObject({
  viewId: z.string().transform((v) => v as ViewId),
  projectId: z.string().transform((v) => v as ProjectId),
  screen: z.literal(['view', 'projects']).default('view'),
})

export const ViewType = 'likec4-preview' as const

export const useDiagramPanel = createSingletonComposable(() => {
  const { logger } = useExtensionLogger('diagram')
  logger.debug('useDiagramPanel activation')

  const state = {
    scope: null as EffectScope | null,
    panel: null as WebviewPanel | null,
    participant: null as WebviewIdMessageParticipant | null,
    viewId: ref<ViewId | null>(null),
    projectId: ref<ProjectId | null>(null),
    title: ref<string | null>(null),
    screen: ref<'view' | 'projects'>('projects'),
    visible: ref(false),
  }

  const viewId = computed(() => state.viewId.value ?? 'index' as ViewId)
  const projectId = computed(() => state.projectId.value ?? 'default' as ProjectId)
  const panelTitle = computed(() => state.title.value ?? 'Diagram Preview')

  const dispose = () => {
    try {
      const scope = state.scope
      // reset panelScope to null to prevent dispose loop
      if (scope) {
        logger.debug`close view scope ${state.viewId.value} (project: ${state.projectId.value})`
        state.scope = null
        state.panel = null
        state.participant = null
        state.viewId.value = null
        state.projectId.value = null
        state.visible.value = false
        state.title.value = null
        state.screen.value = 'projects'
        scope.stop()
      } else {
        logger.debug`panel scope is already closed`
      }
    } catch (e) {
      logger.warn('Error closing panel', { error: e })
    }
  }

  /**
   * Runs inside the effect scope to create the panel and its disposables.
   * @param existingPanel Optional existing panel to use instead of creating a new one.
   */
  function createInScope(existingPanel?: WebviewPanel) {
    const screen = state.screen.value
    const initialViewId = viewId.value
    const initialProjectId = projectId.value
    logger.debug`creating scope for webview screen: ${screen} viewId: ${initialViewId} project: ${initialProjectId}`

    const rpc = useRpc()
    const m = useMessenger()
    const panel = useDisposable(existingPanel ?? createWebviewPanel())

    writeHTMLToWebview(panel, {
      screen,
      viewId: initialViewId,
      projectId: initialProjectId,
    })

    state.visible.value = panel.visible

    const api = useMessenger().registerPanel(panel)

    // When model changes, notify the webview to update
    rpc.onDidChangeModel(() => {
      api.sendModelUpdate()
    })

    useDisposable(panel.onDidDispose(() => {
      // When panel is closed by user, panel.onDidDispose is called.
      // In this case, we need to dispose the scope.
      dispose()
    }))
    useDisposable(panel.onDidChangeViewState((e) => {
      if (state.visible.value !== e.webviewPanel.visible) {
        logger.debug`panel visible changed: ${e.webviewPanel.visible}`
        state.visible.value = e.webviewPanel.visible
        // Became hidden
        if (!state.visible.value) {
          return
        }
        // Became visible
        if (state.screen.value !== 'view') {
          api.sendOpenView({
            screen: state.screen.value,
          })
          return
        }
        api.sendOpenView({
          screen: 'view',
          projectId: state.projectId.value ?? 'default' as ProjectId,
          viewId: state.viewId.value ?? 'index' as ViewId,
        })
      }
    }))

    watch([state.screen, state.viewId, state.projectId], ([screen, viewId, projectId]) => {
      if (screen !== 'view') {
        api.sendOpenView({ screen })
        return
      }
      if (viewId && projectId) {
        api.sendOpenView({
          screen,
          projectId,
          viewId,
        })
        return
      }
      logger.warn`Invalid state: screen: ${screen} viewId: ${viewId} project: ${projectId}`
    })

    m.onWebviewNavigateTo((params) => {
      logger.debug`webview requested navigateTo ${params}`
      state.screen.value = params.screen
      // W
      if (params.screen !== 'view') {
        return
      }
      state.viewId.value = params.viewId
      if (params.projectId) {
        state.projectId.value = params.projectId
      }
    })

    m.onWebviewUpdateMyTitle((params) => {
      logger.debug`webview requested updateMyTitle ${params.title}`
      state.title.value = params.title
    })

    useViewTitle(panel, panelTitle)

    m.onWebviewCloseMe(() => {
      nextTick(() => {
        logger.debug`webview requested closeMe`
        dispose()
      }).catch((error) => {
        logger.warn('Error closing panel', { error })
      })
    })

    return {
      panel,
      participant: api.participant,
    }
  }

  /**
   * Ensures that the panel scope is created and runs the panel scope.
   * If the panel scope is not created, it will be created and run.
   * If the panel scope is created but the panel is null, it will be disposed and re-run.
   */
  function ensurePanelScope(existingPanel?: WebviewPanel) {
    if (existingPanel) {
      invariant(!state.scope, 'Invalid state: panelScope already exists in ensurePanel with existing panel')
    }
    if (!state.scope) {
      state.scope = effectScope(true)
      try {
        const res = state.scope.run(() => createInScope(existingPanel))
        invariant(res, 'Invalid state: runInScope returned null')
        state.panel = res.panel
        state.participant = res.participant
      } catch (e) {
        logger.error('Error creating panel scope', { error: e })
        dispose()
      }
    }
  }

  function open(arg: 'projects' | { viewId: ViewId; projectId: ProjectId }) {
    if (arg === 'projects') {
      if (state.screen.value !== arg) {
        logger.debug`change state.screen to projects`
        state.screen.value = arg
      } else {
        logger.debug`state.screen is already projects`
      }
    } else {
      state.screen.value = 'view'
      state.viewId.value = arg.viewId
      state.projectId.value = arg.projectId
    }

    // reveal panel if already exists
    if (state.panel) {
      if (!state.visible.value) {
        logger.debug`reveal panel`
        state.panel.reveal(undefined, true)
      }
      return
    }
    ensurePanelScope()
  }

  function deserialize(_panel: WebviewPanel, serializeState: any) {
    try {
      const parsedState = serializeStateSchema.safeParse(serializeState)
      if (!parsedState.success) {
        logger.error('Invalid serialized state', { serializeState, issues: z.flattenError(parsedState.error) })
        _panel.dispose()
        return
      }
      logger
        .debug`deserialize panel state screen: ${parsedState.data.screen} viewId: ${parsedState.data.viewId} project: ${parsedState.data.projectId}`
      state.screen.value = parsedState.data.screen
      state.viewId.value = parsedState.data.viewId
      state.projectId.value = parsedState.data.projectId
      ensurePanelScope(_panel)
      _panel.reveal(undefined, true)
    } catch (e) {
      logger.error('Error deserializing panel state', { error: e })
    }
  }

  tryOnScopeDispose(() => {
    logger.debug`tryOnScopeDispose`
    dispose()
  })

  return {
    open,
    close: dispose,
    viewId: readonly(state.viewId),
    projectId: readonly(state.projectId),
    visible: readonly(state.visible),
    deserialize,
    getLastClickedElement: async () => {
      if (state.participant) {
        return await useMessenger().requestGetLastClickedNode(state.participant)
      }
      return {
        element: null,
        deployment: null,
      }
    },
  } as const
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
      enableCommandUris: true,
    },
  )
}
