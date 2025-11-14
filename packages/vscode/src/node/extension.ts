import { loggable } from '@likec4/log'
import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate'
import { configureLogger, loggerOutput } from '../logger'

export const { activate, deactivate } = defineExtension(() => {
  configureLogger()
  try {
    activateExtension('node')
  } catch (e) {
    loggerOutput.error(loggable(e))
  }
})
