import { createConsola, LogLevels } from 'consola/basic'

export { LogLevels } from 'consola/core'

export type * from 'consola/core'

const logger = createConsola({
  level: LogLevels.debug,
  formatOptions: {
    colors: true,
    date: false
  }
})
export { logger, logger as consola, logger as rootLogger }
