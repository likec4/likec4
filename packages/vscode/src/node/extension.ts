import { loggable } from '@likec4/log'
import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate'
import { extensionLogger } from '../logger'

export const { activate, deactivate } = defineExtension(() => {
  try {
    activateExtension('node')
  } catch (e) {
    extensionLogger.error(loggable(e))
  }
})
