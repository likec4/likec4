import type { LogObject } from 'consola/core'
import mergeErrorCause from 'merge-error-cause'
import safeStringify from 'safe-stringify'
import wrapErrorMessage from 'wrap-error-message'

export type FormattedLogObject = {
  message: string
  error?: {
    message: string
    name: string
    stack?: string
  }
}

const defaultParseStack = (stack: string): string[] => {
  const lines = stack.split('\n').map((l) => l.trim().replace('file://', ''))
  return lines
}

export function formattedLogObj(
  logObj: LogObject,
  parseStack = defaultParseStack,
): FormattedLogObject {
  const result: FormattedLogObject = {
    message: '',
  }
  const error = logObj.args.find(a => a instanceof Error)
  if (!error) {
    result.message = logObj.args.map(arg => typeof arg === 'string' ? arg : safeStringify(arg)).join('; ')
    if (typeof logObj.tag === 'string' && logObj.tag.length > 0) {
      result.message = `[${logObj.tag}] ${result.message}`
    }
    return result
  }

  const mergedErr = logObj.args.reduce(
    (acc: Error, arg) => {
      if (arg === error) {
        return acc
      }
      const msg = typeof arg === 'string' ? arg : safeStringify(arg)
      return wrapErrorMessage(acc, msg)
    },
    mergeErrorCause(error),
  )
  result.message = mergedErr.message
  result.error = {
    message: mergedErr.message,
    name: mergedErr.name,
  }
  if (mergedErr.stack) {
    const stack = parseStack(mergedErr.stack)
    result.error.stack = stack.join('\n')
    result.message += '\n' + stack.slice(1).map(l => '  ' + l).join('\n')
  }
  if (typeof logObj.tag === 'string' && logObj.tag.length > 0) {
    result.message = `[${logObj.tag}] ${result.message}`
  }
  return result
}
