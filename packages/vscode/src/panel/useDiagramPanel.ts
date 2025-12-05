import { invariant } from '@likec4/core'
import type { ProjectId, ViewId } from '@likec4/core/types'
import {
  type EffectScope,
  computed,
  createSingletonComposable,
  effectScope,
  nextTick,
  onDeactivate,
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
import { computedModels } from '../sharedstate'
import { useExtensionLogger } from '../useExtensionLogger'
import { useMessenger } from '../useMessenger'
import { useRpc } from '../useRpc'
import { writeHTMLToWebview } from './writeHTMLToWebview'

const serializeStateSchema = z.looseObject({
  viewId: z.string().transform((v) => v as ViewId),
  projectId: z.string().transform((v) => v as ProjectId),
})

export const ViewType = 'likec4-preview' as const

export const useDiagramPanel = createSingletonComposable(() => {
  const { logger } = useExtensionLogger('diagram')

  const state = {
    scope: null as EffectScope | null,
    panel: null as WebviewPanel | null,
    participant: null as WebviewIdMessageParticipant | null,
    viewId: ref<ViewId | null>(null),
    projectId: ref<ProjectId | null>(null),
    visible: ref(false),
  }

  const viewId = computed(() => state.viewId.value ?? 'index' as ViewId)
  const projectId = computed(() => state.projectId.value ?? 'default' as ProjectId)

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
        scope.stop()
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
    const initialViewId = viewId.value
    const initialProjectId = projectId.value
    logger.debug`creating scope for view ${initialViewId} (project: ${initialProjectId})`
    const rpc = useRpc()
    const m = useMessenger()
    const panel = useDisposable(existingPanel ?? createWebviewPanel())

    writeHTMLToWebview(panel, initialViewId, initialProjectId)

    state.visible.value = panel.visible

    const api = useMessenger().registerPanel(panel)

    // When model changes, notify the webview to update
    rpc.onDidChangeModel(() => {
      logger.debug`send modelUpdate to panel`
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
        // Became visible
        if (state.visible.value) {
          api.sendOpenView({
            projectId: projectId.value,
            viewId: viewId.value,
          })
        }
      }
    }))

    watch([state.viewId, state.projectId], ([viewId, projectId]) => {
      if (!viewId) {
        logger.warn('Invalid state: viewId is empty in ensurePanel scope')
        return
      }
      if (!projectId) {
        logger.warn('Invalid state: projectId is empty in ensurePanel scope')
        return
      }
      logger.debug`send ${'OpenView'} ${viewId} from project ${projectId}`
      api.sendOpenView({
        projectId,
        viewId,
      })
    })

    useViewTitle(
      panel,
      computed(() => {
        const _viewId = viewId.value
        const _project = projectId.value
        const view = computedModels.value[_project]?.views[_viewId]
        if (!view) {
          return 'Diagram Preview'
        }
        return view.title ?? `Preview ${view.id}`
      }),
    )

    m.onWebviewNavigateTo((params) => {
      logger.debug`webview requested navigateTo ${params.viewId}`
      state.viewId.value = params.viewId
    })

    m.onWebviewCloseMe((_, sender) => {
      // invariant(participant === api.participant, 'Received closeMe from unknown participant')
      nextTick(() => {
        logger.debug`webview requested closeMe`
        dispose()
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

  function open(viewId: ViewId, projectId: ProjectId) {
    logger.debug`open view ${viewId} (project: ${projectId})`
    state.viewId.value = viewId
    state.projectId.value = projectId
    // reveal panel if already exists
    if (state.panel) {
      if (!state.visible.value) {
        logger.debug`reveal panel for view ${viewId} (project: ${projectId})`
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
      logger.debug`deserialize view ${parsedState.data.viewId} (project: ${parsedState.data.projectId})`
      state.viewId.value = parsedState.data.viewId
      state.projectId.value = parsedState.data.projectId
      ensurePanelScope(_panel)
      _panel.reveal(undefined, true)
    } catch (e) {
      logger.error('Error deserializing panel state', { error: e })
    }
  }

  tryOnScopeDispose(() => {
    dispose()
  })
  onDeactivate(() => {
    dispose()
  })

  return {
    open,
    close: dispose,
    viewId,
    projectId,
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
      enableCommandUris: true,
    },
  )
}
