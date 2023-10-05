import boxen from 'boxen'
import k from 'kleur'
import type { PreviewServer, ViteDevServer } from 'vite'

export function printServerUrls(server: ViteDevServer | PreviewServer) {
  if (!server.resolvedUrls) {
    console.error('Vite server is not ready, no resolvedUrls')
    process.exit(1)
  }
  let text = k.dim('Local:  ') + server.resolvedUrls.local.join('\n' + ''.padEnd(8, ' '))
  text += '\n\n'
  text += k.dim('Remote: ') + server.resolvedUrls.network.join('\n' + ''.padEnd(8, ' '))

  console.log(
    boxen(text, {
      padding: 1,
      margin: 1,
      title: 'LikeC4 served at:',
      borderStyle: 'round',
      borderColor: 'yellow'
    })
  )
}
