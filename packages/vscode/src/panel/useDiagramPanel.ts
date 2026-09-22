import { invariant } from '@likec4/core'
import type { ProjectId, ViewId } from '@likec4/core/types'
import {
  type EffectScope,
  computed,
  defineService,
  effectScope,
  nextTick,
  onScopeDispose,
  reactive,
  readonly,
  toValue,
  useDisposable,
  watch,
} from 'reactive-vscode'
import { isNullish } from 'remeda'
import { type WebviewPanel, commands as cmd, ViewColumn, window } from 'vscode'
import type { WebviewIdMessageParticipant } from 'vscode-messenger-common'
import * as z from 'zod/v4'
import { commands } from '../meta.ts'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import { useMessenger } from '../useMessenger.ts'
import { useRpc } from '../useRpc.ts'
import { writeHTMLToWebview } from './writeHTMLToWebview.ts'

const serializeStateSchema = z.looseObject({
  viewId: z.string().transform((v) => v as ViewId).nullish(),
  projectId: z.string().transform((v) => v as ProjectId).nullish(),
  screen: z.literal(['view', 'projects']).default('projects'),
})

export const ViewType = 'likec4-preview' as const

const DEFAULT_TITLE = 'Diagram Preview'

export const useDiagramPanel = defineService(() => {
  const { logger } = useExtensionLogger('diagram')
  logger.debug('useDiagramPanel activation')

  const rpc = useRpc()
  const m = useMessenger()

  const active = {
    scope: null,
    panel: null,
    participant: null,
  } as {
    scope: EffectScope
    panel: WebviewPanel | null
    participant: WebviewIdMessageParticipant | null
  } | {
    scope: EffectScope | null
    panel: null
    participant: null
  }

  const state = reactive({
    viewId: null as ViewId | null,
    projectId: null as ProjectId | null,
    title: DEFAULT_TITLE,
    screen: 'projects' as 'view' | 'projects',
    visible: false as boolean,
    panelViewColumn: null as ViewColumn | null,
  })

  const viewId = computed(() => state.viewId ?? 'index' as ViewId)
  const projectId = computed(() => state.projectId ?? 'default' as ProjectId)

  function resetState() {
    logger.trace(`reset diagram panel state`)
    state.visible = false
    state.panelViewColumn = null
    state.title = DEFAULT_TITLE
    state.screen = 'projects'
    if (active.scope) {
      logger.error('reset diagram state: scope is not null')
      active.scope = null
      active.panel?.dispose()
      active.panel = null
      active.participant = null
    }
  }

  function dispose() {
    try {
      const { scope, panel } = active
      // reset active state to null to prevent dispose loop
      active.scope = null
      active.panel = null
      active.participant = null
      // Ensure that panel is disposed
      panel?.dispose()
      // If scope is null, we don't need to do anything else
      if (!scope) {
        return
      }
      logger.debug`close view scope ${state.viewId} (project: ${state.projectId})`
      scope.stop()
    } catch (e) {
      logger.warn('Error closing panel', { error: e })
    }
  }

  /**
   * Runs inside the effect scope to create the panel and its disposables.
   * @param existingPanel Optional existing panel to use instead of creating a new one.
   */
  function createInScope(existingPanel?: WebviewPanel) {
    const screen = state.screen
    const initialViewId = toValue(viewId)
    const initialProjectId = toValue(projectId)
    logger.debug`creating scope for webview screen: ${screen} viewId: ${initialViewId} project: ${initialProjectId}`

    const panel = existingPanel ?? createWebviewPanel()

    useDisposable(panel.onDidDispose(() => {
      // When panel is closed by user, panel.onDidDispose is called.
      // In this case, we need to dispose the scope.
      logger.trace`onDidDispose`
      dispose()
    }))

    writeHTMLToWebview(panel, {
      screen,
      viewId: initialViewId,
      projectId: initialProjectId,
    })
    panel.title = state.title

    state.visible = panel.visible
    state.panelViewColumn = panel.viewColumn ?? null

    const api = useMessenger().registerPanel(panel)

    // When project model changes, notify the webview to update
    rpc.onDidChangeModel(({ projectId }) => {
      const viewProjectId = toValue(state.projectId)
      if (isNullish(viewProjectId) || projectId === viewProjectId) {
        api.sendModelUpdate()
      }
    })
    rpc.onDidChangeProjects(() => {
      api.sendProjectsUpdate()
    })

    useDisposable(panel.onDidChangeViewState((e) => {
      state.panelViewColumn = e.webviewPanel.viewColumn ?? null
      if (state.visible !== e.webviewPanel.visible) {
        logger.debug`panel visible changed: ${e.webviewPanel.visible}`
        state.visible = e.webviewPanel.visible
      }
    }))

    const viewUpdate = computed(() =>
      state.screen === 'view' && state.viewId && state.projectId
        ? {
          visible: state.visible,
          screen: 'view',
          viewId: state.viewId,
          projectId: state.projectId,
        } as const
        : {
          visible: state.visible,
          screen: 'projects',
        } as const
    )

    watch(viewUpdate, ({ visible, ...next }) => {
      if (!visible) {
        return
      }
      api.sendOpenView(next)
    })

    m.onWebviewNavigateTo((params) => {
      logger.debug`webview requested navigateTo ${params}`
      state.screen = params.screen
      if (params.screen !== 'view') {
        return
      }
      state.viewId = params.viewId
      if (params.projectId) {
        state.projectId = params.projectId
      }
    })

    m.onWebviewUpdateMyTitle((params) => {
      logger.debug`webview requested updateMyTitle ${params.title}`
      state.title = params.title
    })

    watch(() => state.title, (title) => {
      if (active.panel) {
        active.panel.title = title || DEFAULT_TITLE
      }
    })

    m.onWebviewEnhanceWithAI(async () => {
      logger.debug`webview requested semanticLayoutWithAi`
      await cmd.executeCommand(commands.semanticLayoutWithAi)
    })

    m.onWebviewCloseMe(() => {
      logger.debug`closeMe`
      dispose()
    })

    // Clean up when scope is disposed
    onScopeDispose(() => {
      logger.debug`onScopeDispose`
      resetState()
    })

    return {
      panel,
      participant: api.participant,
    }
  }

  /**
   * Ensures that the panel scope is created and runs the panel scope.
   * @param existingPanel Optional existing panel to use instead of creating a new one.
   */
  function ensurePanelScope(existingPanel?: WebviewPanel) {
    // if scope and panel are already created, and we are not asked to create new panel, return
    if (active.scope && active.panel && !existingPanel) {
      return
    }
    // dispose scope otherwise
    dispose()
    active.scope = effectScope(true)
    try {
      const res = active.scope.run(() => createInScope(existingPanel))
      invariant(res, 'Invalid state: runInScope returned null')
      active.panel = res.panel
      active.participant = res.participant
    } catch (e) {
      logger.error('Error creating panel scope', { error: e })
      dispose()
    }
  }

  function open(arg: 'projects' | { viewId: ViewId; projectId: ProjectId }) {
    if (arg === 'projects') {
      if (state.screen !== arg) {
        logger.debug`change state.screen to ${arg}`
        state.screen = arg
      } else {
        logger.debug`state.screen is already ${arg}`
      }
    } else {
      if (state.screen !== 'view') {
        logger.debug`change state.screen to ${'view'}`
        state.screen = 'view'
      }
      state.viewId = arg.viewId
      state.projectId = arg.projectId
    }

    // reveal panel if already exists
    if (active.panel) {
      if (!active.panel.visible) {
        logger.debug`reveal panel`
        active.panel.reveal(undefined, true)
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
      const { viewId, projectId, screen } = parsedState.data
      logger
        .debug`deserialize panel state screen: ${screen} viewId: ${viewId} project: ${projectId}`
      state.screen = screen
      state.viewId = viewId ?? state.viewId
      state.projectId = projectId ?? state.projectId
      ensurePanelScope(_panel)
      void nextTick(() => {
        if (screen !== 'view' || !viewId || !projectId) {
          open('projects')
          return
        }
        open({ viewId, projectId })
      })
    } catch (e) {
      logger.error('Error deserializing panel state', { error: e })
    }
  }

  return {
    open,
    close: dispose,
    viewId: readonly(viewId),
    projectId: readonly(projectId),
    visible: computed(() => state.visible),
    panelViewColumn: computed(() => state.panelViewColumn),
    deserialize,
    getLastClickedElement: async () => {
      if (active.participant) {
        return await useMessenger().requestGetLastClickedNode(active.participant)
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
  const activeEditorColumn = window.activeTextEditor?.viewColumn
  return window.createWebviewPanel(
    ViewType,
    'Diagram Preview',
    {
      viewColumn: activeEditorColumn === ViewColumn.One ? ViewColumn.Beside : ViewColumn.One,
      preserveFocus: false,
    },
    {
      retainContextWhenHidden: true,
      enableScripts: true,
      enableCommandUris: true,
    },
  )
}
