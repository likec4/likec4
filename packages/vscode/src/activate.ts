import useTelemetry from '#useTelemetry'
import { ConfigFilenames } from '@likec4/config'
import {
  onDeactivate,
  toRef,
  useFileSystemWatcher,
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
