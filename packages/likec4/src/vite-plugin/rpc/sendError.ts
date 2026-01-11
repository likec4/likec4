import type { PluginRPCParams } from './index'

export function sendError(server: PluginRPCParams['server'], { name, error }: { name?: string; error: string }) {
  const lines = error.split('\n')
  const test = /^\s+at\s+/
  let stackBeginAt = lines.findIndex(l => test.test(l))
  if (stackBeginAt === -1) {
    stackBeginAt = lines.length
  }
  server.hot.send({
    type: 'error',
    err: {
      message: lines.slice(0, stackBeginAt).join('\n'),
      stack: lines.slice(stackBeginAt).join('\n'),
      name: name ?? 'LikeC4PluginError',
      plugin: 'vite-plugin-likec4',
    },
  })
}
