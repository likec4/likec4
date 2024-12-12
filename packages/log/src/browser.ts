import { createConsola } from 'consola/browser'
import { LogLevels } from 'consola/core'

export type * from 'consola/core'

const consola = createConsola({
  level: LogLevels.debug
})

export { consola, consola as logger, consola as rootLogger, LogLevels }
