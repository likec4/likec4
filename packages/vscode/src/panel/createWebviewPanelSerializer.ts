import { nextTick, shallowRef, triggerRef, useDisposable, watch } from 'reactive-vscode'
import * as vscode from 'vscode'
import { useExtensionLogger } from '../useExtensionLogger'
import { whenExtensionActive } from '../useIsActivated'
import { useDiagramPanel, ViewType } from './useDiagramPanel'

export function createWebviewPanelSerializer() {
  const { logger } = useExtensionLogger()
  let immediate = false
  const state = shallowRef({} as {
    serializedState?: any
    panel?: vscode.WebviewPanel | undefined
  })

  whenExtensionActive(() => {
    const { stop } = watch(state, ({ panel, serializedState }) => {
      if (!panel) return
      logger.debug('preview.deserialize')
      const preview = useDiagramPanel()
      preview.deserialize(panel, serializedState)
      void nextTick(() => {
        state.value.panel = undefined
        state.value.serializedState = undefined
        stop()
      })
    }, {
      immediate,
    })
  })

  logger.info('registerWebviewPanelSerializer for diagram preview panel')
  return useDisposable(vscode.window.registerWebviewPanelSerializer(
    ViewType,
    new class {
      async deserializeWebviewPanel(
        panel: vscode.WebviewPanel,
        panelState: any,
      ) {
        logger.debug('deserializeWebviewPanel')
        state.value.panel = panel
        state.value.serializedState = panelState
        immediate = true
        triggerRef(state)
      }
    }(),
  ))
}
