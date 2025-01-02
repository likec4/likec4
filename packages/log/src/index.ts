import { createConsola } from 'consola'
import { type LogObject, LogLevels } from 'consola/core'
import { sep } from 'node:path'
import { cwd } from 'node:process'
import { type FormattedLogObject, formattedLogObj } from './format'

export type * from 'consola/core'
export type { FormattedLogObject }

function parseStack(stack: string): string[] {
  const currentDir = cwd() + sep
  const lines = stack.split('\n').map((l) => l.trim().replace('file://', '').replace(currentDir, ''))
  return lines
}

export function formatLogObj(logObj: LogObject): FormattedLogObject {
  return formattedLogObj(logObj, parseStack)
}

const level = LogLevels.debug

const consola = createConsola({
  level,
  defaults: {
    level,
  },
  throttle: 2,
  throttleMin: 500,
  formatOptions: {
    colors: true,
    compact: false,
    date: false,
  },
})

export { consola, consola as logger, consola as rootLogger, LogLevels }
