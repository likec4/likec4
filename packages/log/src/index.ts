import { createConsola } from 'consola'
import { LogLevels } from 'consola/core'

export type * from 'consola/core'

// function _getDefaultLogLevel(): LogLevel {
//   return LogLevels.debug
// }

const level = LogLevels.debug

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
