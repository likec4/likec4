import { loggable } from '@likec4/log'
import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate'
import { initWorkspace } from '../common/initWorkspace'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { whenExtensionActive } from '../common/useIsActivated'
import { logError } from '../logger'
import { useRpc } from '../Rpc'

export const { activate, deactivate } = defineExtension(() => {
  const { logger } = useExtensionLogger()
  try {
    activateExtension('web')
  } catch (e) {
    logger.error(loggable(e))
  }
  whenExtensionActive(() => {
    const rpc = useRpc()
    initWorkspace(rpc).catch((e) => {
      logError(e)
    })
  })
})
