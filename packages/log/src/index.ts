import { createConsola, LogLevels } from 'consola/core'

export { LogLevels } from 'consola/core'

export type * from 'consola/core'

const logger = createConsola({
  level: LogLevels.debug
})
export { logger, logger as consola, logger as rootLogger }
