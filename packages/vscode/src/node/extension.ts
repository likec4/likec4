import { loggable } from '@likec4/log'
import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate'
import { useExtensionLogger } from '../common/useExtensionLogger'

export const { activate, deactivate } = defineExtension(() => {
  const { logger } = useExtensionLogger()
  try {
    activateExtension('node')
  } catch (e) {
    logger.error(loggable(e))
  }
})
