import { createConsola, LogLevels } from 'consola/browser'

export { LogLevels } from 'consola/browser'

export type * from 'consola/browser'

const logger = createConsola({
  level: LogLevels.debug
})
export { logger, logger as consola, logger as rootLogger }
