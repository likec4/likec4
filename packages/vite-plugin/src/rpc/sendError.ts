import type { PluginRPCParams } from './rpc'

export function splitErrorMessage(error: string) {
  const lines = error.split('\n')
  const test = /^\s+at\s+/
  let stackBeginAt = lines.findIndex(l => test.test(l))
  if (stackBeginAt === -1) {
    stackBeginAt = 1 // Assume the error message is on the first line, stack starts on the second
  }
  return {
    message: lines.slice(0, stackBeginAt).join('\n'),
    stack: lines.slice(stackBeginAt).join('\n'),
  }
}

export function sendError(server: PluginRPCParams['server'], { name, error }: { name?: string; error: string }) {
  server.hot.send({
    type: 'error',
    err: {
      ...splitErrorMessage(error),
      name: name ?? 'LikeC4PluginError',
      plugin: 'vite-plugin-likec4',
    },
  })
}
