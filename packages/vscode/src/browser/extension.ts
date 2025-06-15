import { loggable } from '@likec4/log'
import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate'
import { initWorkspace } from '../common/initWorkspace'
import { whenExtensionActive } from '../common/useIsActivated'
import { extensionLogger, logError } from '../logger'

export const { activate, deactivate } = defineExtension(() => {
  try {
    activateExtension('web')
  } catch (e) {
    extensionLogger.error(loggable(e))
  }
  whenExtensionActive(async () => {
    try {
      await initWorkspace()
    } catch (e) {
      logError(e)
    }
  })
})
