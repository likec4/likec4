import { createLogger } from 'vite'
import k from 'kleur'
// export const debug = debugPkg('likec4:cli')

// debug.diff
export const logger = createLogger('info', {
  prefix: 'likec4',
  allowClearScreen: false
})

const ERROR = k.bgRed().white().bold('ERROR')
export const logError = (err: string | Error) => {
  if (typeof err === 'string') {
    logger.error(ERROR + ' ' + err)
  } else {
    logger.error(ERROR + ' ' + err.message, {
      error: err
    })
  }
}

export const logInfo = (info: string) => {
  logger.info(info)
}

const DEBUG = k.dim().bold('DEBUG')
export const logDebug = (info: string) => {
  logger.info(`${DEBUG}: ${info}`)
}
