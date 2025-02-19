import mergeErrorCause from 'merge-error-cause'
import safeStringify from 'safe-stringify'

export const parseStack = (stack: string): string[] => {
  const lines = stack
    .split('\n')
    .map((l) => {
      let replaced = l.trim()
        .replace('file://', '')
      // // Remove c:\Users\<user>... -> @vscode...
      // .replace(/[A-Za-z]:\\Users\\[^\\]+\\/g, '@vscode\\')
      // // Remove /Users/<user>/... -> @vscode/...
      // .replace(/\/Users\/[^/]+\//g, '@vscode/')
      return replaced
    })
  return lines
}

export function ident(value: string | string[], identation = 2): string {
  value = Array.isArray(value) ? value : value.split('\n')
  return value.map((l) => `${' '.repeat(identation)}${l}`).join('\n')
}

export function loggable(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    const mergedErr = mergeErrorCause(error)
    if (mergedErr.stack) {
      const stack = parseStack(mergedErr.stack)
      return mergedErr.message + '\n' + ident(stack.slice(1))
    }
    return mergedErr.message
  }
  return safeStringify(error)
}
