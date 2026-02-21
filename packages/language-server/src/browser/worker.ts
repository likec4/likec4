// This is an example copied as is from here:
// https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-web-extension-sample/server/src/browserServerMain.ts

import { startLanguageServer } from './index'

declare const self: DedicatedWorkerGlobalScope

function errToString(err: unknown): string {
  switch (true) {
    case err instanceof Error:
      return err.message
    case typeof err === 'object' && err !== null:
      try {
        return JSON.stringify(err)
      } catch {
        return '[unserializable value]'
      }
    case typeof err === 'string':
      return err
    case err === null || err === undefined:
      return ''
    case typeof err === 'number' || typeof err === 'boolean':
      return String(err)
    case typeof err === 'symbol':
      return err.toString()
    default:
      return 'unknown'
  }
}
const log = (msg: string, err?: unknown) => {
  const line = err === undefined || err === null ? msg : `${msg} ${errToString(err)}`
  try {
    console.error('[LikeC4 LSP worker]', line)
  } catch {
    // ignore
  }
}

self.onerror = (event) => {
  log('Uncaught error', event.message ?? event.error)
  return false
}
self.onunhandledrejection = (event) => {
  log('Unhandled rejection', event.reason)
}

try {
  startLanguageServer(self)
} catch (err) {
  log('Failed to start language server', err)
  throw err
}
