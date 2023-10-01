import type { LogErrorOptions } from 'vite'
import { createLogger } from 'vite'
import k from 'kleur'
// export const debug = debugPkg('likec4:cli')

// debug.diff
export const logger = createLogger('info', {
  prefix: 'likec4',
  allowClearScreen: false
})

const ERROR = k.bgRed().white().bold('ERROR')

export const logError = (err: string | Error, options?: LogErrorOptions) => {
  if (typeof err === 'string') {
    logger.error(ERROR + ' ' + err, {
      timestamp: true,
      ...options
    })
  } else {
    logger.error(ERROR + ' ' + err.message, {
      timestamp: true,
      error: err,
      ...options
    })
  }
}

const WARN = k.bgYellow().black().bold('WARN')
export const logWarn = (warn: string) => {
  logger.warn(`${WARN}: ${warn}`, { timestamp: true })
}

const INFO = k.green().bold('INFO')
export const logInfo = (info: string) => {
  logger.info(`${INFO}: ${info}`, { timestamp: true })
}

const DEBUG = k.dim().bold('DEBUG')
export const logDebug = (info: string) => {
  logger.info(`${DEBUG}: ${info}`, { timestamp: true })
}
