import { loggable } from '@likec4/log'
import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate'
import { initWorkspace } from '../common/initWorkspace'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { whenExtensionActive } from '../common/useIsActivated'
import { logError } from '../logger'

export const { activate, deactivate } = defineExtension(() => {
  const { logger } = useExtensionLogger()
  try {
    activateExtension('web')
  } catch (e) {
    logger.error(loggable(e))
  }
  whenExtensionActive(async () => {
    try {
      await initWorkspace()
    } catch (e) {
      logError(e)
    }
  })
})
