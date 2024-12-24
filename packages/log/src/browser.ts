import { createConsola } from 'consola/browser'
import { type LogObject, LogLevels } from 'consola/core'
import { type FormattedLogObject, formattedLogObj } from './format'

export type * from 'consola/core'
export type { FormattedLogObject }

const consola = createConsola({
  level: LogLevels.debug,
})

export function formatLogObj(logObj: LogObject): FormattedLogObject {
  return formattedLogObj(logObj)
}

export { consola, consola as logger, consola as rootLogger, LogLevels }
