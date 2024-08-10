// import { createConsola, LogLevels, LogTypes } from 'consola/core'
import { createConsola, LogLevels } from 'consola'

export type * from 'consola/core'

const logger = createConsola({
  level: LogLevels.debug,
  fancy: true,
  formatOptions: {
    colors: true,
    compact: true,
    date: false
  }
})
export { logger, logger as consola, logger as default, logger as rootLogger, LogLevels }
