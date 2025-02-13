import { first } from 'remeda'
import k from 'tinyrainbow'
import type { PreviewServer, ViteDevServer } from 'vite'
import { boxen } from '../logger'

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

  boxen([
    k.green('LikeC4 served at:'),
    '',
    k.dim('Local:   ') + server.resolvedUrls.local.join('\n' + ''.padEnd(9, ' ')),
    k.dim('Network: ') + server.resolvedUrls.network.join('\n' + ''.padEnd(9, ' ')),
  ].join('\n'))
}
