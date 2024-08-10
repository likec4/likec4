import { createConsola, LogLevels } from 'consola/basic'

export type * from 'consola/basic'

const logger = createConsola({
  level: LogLevels.debug,
  fancy: true,
  formatOptions: {
    colors: true,
    compact: true,
    date: false
  }
})
export { logger, logger as consola, logger as rootLogger, LogLevels }
