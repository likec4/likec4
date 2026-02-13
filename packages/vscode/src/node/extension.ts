import { loggable } from '@likec4/log'
import {
  defineExtension,
} from 'reactive-vscode'
import { activateExtension } from '../activate.ts'
import { useConfigureLogger } from '../useExtensionLogger.ts'
import { useMcpRegistration } from './useMcpRegistration.ts'

export const { activate, deactivate } = defineExtension(() => {
  const { output, configureLogger } = useConfigureLogger()
  configureLogger()
  try {
    activateExtension('node')
    useMcpRegistration()
  } catch (e) {
    output.error(loggable(e))
  }
})
