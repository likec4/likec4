import { createConsola, LogLevels } from 'consola/browser'

export { LogLevels } from 'consola/browser'

export type * from 'consola/core'

const logger = createConsola({
  level: LogLevels.debug
})
export { logger, logger as consola, logger as rootLogger }
