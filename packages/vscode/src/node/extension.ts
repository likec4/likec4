import { loggable } from '@likec4/log'
import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate'
import { useConfigureLogger } from '../useExtensionLogger'

export const { activate, deactivate } = defineExtension(() => {
  const { output, configureLogger } = useConfigureLogger()
  configureLogger()
  try {
    activateExtension('node')
  } catch (e) {
    output.error(loggable(e))
  }
})
