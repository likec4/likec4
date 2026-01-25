import useTelemetry from '#useTelemetry'
import { ConfigFilenames } from '@likec4/config'
import {
  onDeactivate,
  toRef,
  useFsWatcher,
} from 'reactive-vscode'
import { registerCommands } from './commands'
import {
  activateMessenger,
  createWebviewPanelSerializer,
  useDiagramPanel,
} from './panel'
import { registerBuiltinFileSystem } from './registerBuiltinFileSystem'
import { useExtensionLogger } from './useExtensionLogger'
import { whenExtensionActive } from './useIsActivated'
import { useLanguageClient } from './useLanguageClient'
import { useRpc } from './useRpc'
import { performanceMark } from './utils'

export function activateExtension(extensionKind: 'node' | 'web') {
  const m = performanceMark()
  const { logger, output } = useExtensionLogger()
  logger.info(`activateExtension: ${extensionKind}`)

  registerBuiltinFileSystem()
  const { client, startLanguageServer } = useLanguageClient()
  const rpc = useRpc()
  const preview = useDiagramPanel()

  createWebviewPanelSerializer()

  activateMessenger()

  startLanguageServer()

  registerCommands()

  monitorFileSystemEvents()

  rpc.onRequestOpenView(({ viewId, projectId }) => {
    logger.debug`rpc request open view ${viewId} of project ${projectId}`
    preview.open({
      viewId,
      projectId,
    })
  })

  whenExtensionActive(() => {
    logger.info(`activateExtension done in ${m.pretty}`)
    useTelemetry()
      .sendTelemetry('activation', { extensionKind })
  })

  onDeactivate(() => {
    output.info('deactivate extension')
  })

  return {
    rpc,
    preview,
    client,
  }
}

function monitorFileSystemEvents() {
  const rpc = useRpc()
  const { logger } = useExtensionLogger('fswatcher')

  // Watch for config file changes
  const configWatcher = useFsWatcher(toRef(`**/{${ConfigFilenames.join(',')}}`))
  configWatcher.onDidChange((uri) => {
    logger.debug(`Config file changed: ${uri}`)
    void rpc.registerProject({ configUri: uri.toString() })
  })
  configWatcher.onDidCreate((uri) => {
    logger.debug(`Config file created: ${uri}`)
    void rpc.registerProject({ configUri: uri.toString() })
  })
  configWatcher.onDidDelete((uri) => {
    logger.debug(`Config file deleted: ${uri}`)
    void rpc.reloadProjects()
  })

  // Watch for view snapshot changes
  const viewSnapshotWatcher = useFsWatcher(toRef(`**/*.likec4.snap`))
  viewSnapshotWatcher.onDidChange((uri) => {
    logger.debug`view snapshot changed: ${uri.fsPath}`
    void rpc.notifyDidChangeSnapshot(uri)
  })
  viewSnapshotWatcher.onDidCreate((uri) => {
    logger.debug`view snapshot created: ${uri.fsPath}`
    void rpc.notifyDidChangeSnapshot(uri)
  })
  viewSnapshotWatcher.onDidDelete((uri) => {
    logger.debug`view snapshot deleted: ${uri.fsPath}`
    void rpc.notifyDidChangeSnapshot(uri)
  })
}
