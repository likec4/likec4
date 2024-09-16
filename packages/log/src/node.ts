import { createConsola, type LogLevel, LogLevels } from 'consola'

export type * from 'consola/core'

function _getDefaultLogLevel(): LogLevel {
  // if (isDebug || isDevelopment) {
  //   return LogLevels.debug
  // }
  // if (isTest) {
  //   return LogLevels.warn
  // }
  // return LogLevels.info
  return LogLevels.debug
}

const level = _getDefaultLogLevel()

const consola = createConsola({
  level,
  defaults: {
    level
  },
  formatOptions: {
    colors: true,
    compact: false,
    date: false
  }
})

export { consola, consola as logger, consola as rootLogger, LogLevels }
