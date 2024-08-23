import { consola } from '@likec4/log'
import { first } from 'remeda'
import k from 'tinyrainbow'
import type { PreviewServer, ViteDevServer } from 'vite'

export function resolveServerUrl(server: ViteDevServer | PreviewServer) {
  if (!server.resolvedUrls) {
    return undefined
  }
  return first(server.resolvedUrls.network) ?? first(server.resolvedUrls.local)
}

export function printServerUrls(server: ViteDevServer | PreviewServer) {
  if (!server.resolvedUrls) {
    throw new Error('Vite server is not ready, no resolvedUrls')
  }

  consola.box([
    k.green('LikeC4 served at:'),
    '',
    k.dim('Local:   ') + server.resolvedUrls.local.join('\n' + ''.padEnd(9, ' ')),
    k.dim('Network: ') + server.resolvedUrls.network.join('\n' + ''.padEnd(9, ' '))
  ].join('\n'))
}
