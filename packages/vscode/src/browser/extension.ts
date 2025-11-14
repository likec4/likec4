import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate'
import { initWorkspace } from '../common/initWorkspace'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { whenExtensionActive } from '../common/useIsActivated'
import { configureLogger } from '../logger'
import { useRpc } from '../Rpc'

export const { activate, deactivate } = defineExtension(() => {
  configureLogger()
  const { logError } = useExtensionLogger()
  try {
    activateExtension('web')
  } catch (e) {
    logError(e)
  }
  whenExtensionActive(() => {
    const rpc = useRpc()
    initWorkspace(rpc).catch((e) => {
      logError(e)
    })
  })
})
