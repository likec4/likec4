import { configureLanguageServerLogger } from '@likec4/language-server'
import { isColorSupported } from 'std-env'
import type { InitOptions } from '../common/options'

export function configureLogger(
  options: InitOptions | undefined,
) {
  const opt = options?.configureLogger ?? 'console'

  if (opt === false) {
    return
  }

  if (opt === 'stderr' || options?.mcp === 'stdio') {
    configureLanguageServerLogger({
      useStdErr: true,
      colors: false,
      logLevel: options?.logLevel,
    })
    return
  }

  configureLanguageServerLogger({
    colors: isColorSupported,
    logLevel: options?.logLevel,
  })
}
