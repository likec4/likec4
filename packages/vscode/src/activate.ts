import useDocumentSelector from '#useDocumentSelector'
import useLanguageClient from '#useLanguageClient'
import { ConfigFilenames } from '@likec4/config'
import {
  nextTick,
  onDeactivate,
  shallowRef,
  toRef,
  toValue,
  triggerRef,
  tryOnScopeDispose,
  useDisposable,
  useFsWatcher,
  watch,
} from 'reactive-vscode'
import * as vscode from 'vscode'
import { State } from 'vscode-languageclient'
import { registerCommands } from './commands'
import { useBuiltinFileSystem } from './common/useBuiltinFileSystem'
import { useDiagramPanel, ViewType } from './common/useDiagramPanel'
import { useIsActivated, whenExtensionActive } from './common/useIsActivated'
import { activateMessenger, useMessenger } from './common/useMessenger'
import { useTelemetry } from './common/useTelemetry'
import { isDev } from './const'
import { logger } from './logger'
import { useRpc } from './Rpc'
import { latestUpdatedSnapshotUri } from './state'
import { performanceMark } from './utils'

export function activateExtension(extensionKind: 'node' | 'web') {
  const m = performanceMark()
  useBuiltinFileSystem()
  const telemetry = useTelemetry()
  logger.info(`activateExtension: ${extensionKind}`)

  whenExtensionActive(() => {
    logger.info(`activateExtension done in ${m.pretty}`)
    telemetry.sendTelemetryEvent('activation', { extensionKind })
  })

  activateLc()

  createWebviewPanelSerializer(() => {
    logger.info('activate language client because of opened preview panel')
  })

  onDeactivate(() => {
    logger.info('deactivate extension')
  })
}

function stateName(state: State) {
  switch (state) {
    case State.Stopped:
      return 'Stopped'
    case State.Starting:
      return 'Starting'
    case State.Running:
      return 'Running'
  }
}

function activateLc() {
  const isActivated = useIsActivated()
  const client = useLanguageClient()
  const rpc = useRpc()
  const messenger = useMessenger()
  const preview = useDiagramPanel()
  activateMessenger({ rpc, preview, messenger })

  logger.debug('starting language server')
  client.start()
    .then(() => {
      logger.info('language server started')
      isActivated.value = true
    })
    .catch(error => {
      logger.error('Failed to start language server', { error })
    })

  const documentSelector = useDocumentSelector()

  if (isDev) {
    useDisposable(client.onDidChangeState((event) => {
      logger.debug(`onDidChangeState: ${stateName(event.oldState)} -> ${stateName(event.newState)}`)
    }))
  }

  async function restartServer() {
    logger.info('restarting language server')
    if (client.isRunning()) {
      logger.info('stopping language server')
      await client.stop()
    }
    client.outputChannel.clear()
    await client.start()
    logger.info('language server restarted')
  }

  watch(documentSelector, async () => {
    client.clientOptions.documentSelector = toValue(documentSelector)
    await restartServer()
  })

  registerCommands({
    restartServer,
  })

  const configWatcher = useFsWatcher(toRef(`**/{${ConfigFilenames.join(',')}}`))
  configWatcher.onDidChange((uri) => {
    logger.debug(`Config file changed: ${uri}`)
    void rpc.reloadProjects()
  })
  configWatcher.onDidCreate((uri) => {
    logger.debug(`Config file created: ${uri}`)
    void rpc.reloadProjects()
  })
  configWatcher.onDidDelete((uri) => {
    logger.debug(`Config file deleted: ${uri}`)
    void rpc.reloadProjects()
  })

  const viewSnapshotWatcher = useFsWatcher(toRef(`**/*.likec4.snap`))
  viewSnapshotWatcher.onDidChange((uri) => {
    if (latestUpdatedSnapshotUri.value === uri.toString()) {
      logger.debug(`Ignoring view snapshot change triggered by self: ${uri.fsPath}`)
      return
    }
    logger.debug(`View snapshot changed: ${uri.fsPath}`)
    void rpc.notifyDidChangeSnapshot(uri)
  })
  viewSnapshotWatcher.onDidCreate((uri) => {
    if (latestUpdatedSnapshotUri.value === uri.toString()) {
      logger.debug`Ignoring view snapshot creation triggered by self: ${uri.fsPath}`
      latestUpdatedSnapshotUri.value = null
      return
    }
    logger.debug`View snapshot created: ${uri.fsPath}`
    void rpc.notifyDidChangeSnapshot(uri)
  })
  viewSnapshotWatcher.onDidDelete((uri) => {
    if (latestUpdatedSnapshotUri.value === uri.toString()) {
      logger.debug`Ignoring view snapshot deletion triggered by self: ${uri.fsPath}`
      latestUpdatedSnapshotUri.value = null
      return
    }
    logger.debug`View snapshot deleted: ${uri.fsPath}`
    void rpc.notifyDidChangeSnapshot(uri)
  })
}

function createWebviewPanelSerializer(onActivate: () => void) {
  const deserializeState = shallowRef<any>(null)
  const deserializePanel = shallowRef<vscode.WebviewPanel | null>(null)
  const preview = useDiagramPanel()

  whenExtensionActive(() => {
    logger.info('registerWebviewPanelSerializer for diagram preview panel')
    const { stop } = watch(deserializePanel, (panel) => {
      if (!panel) return
      preview.deserialize(panel, deserializeState.value)
      void nextTick(() => {
        deserializeState.value = null
        deserializePanel.value = null
        stop()
      })
    }, {
      immediate: true,
    })
  })

  return useDisposable(vscode.window.registerWebviewPanelSerializer(
    ViewType,
    new class {
      async deserializeWebviewPanel(
        panel: vscode.WebviewPanel,
        state: any,
      ) {
        deserializeState.value = state
        deserializePanel.value = panel
        triggerRef(deserializePanel)
        onActivate()
      }
    }(),
  ))
}
