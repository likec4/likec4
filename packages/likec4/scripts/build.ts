import { consola } from 'consola'
import { mkdir } from 'node:fs/promises'
import { startTimer } from '../src/logger'
import { bundleApp } from './bundle-app'
import { buildReact } from './bundle-react'
import { buildWebcomponentBundle } from './bundle-webcomponent'

// const watch = process.argv.includes('--watch')
const isDev = process.env['NODE_ENV'] !== 'production' && process.env['NODE_ENV'] !== 'prod'
if (isDev) {
  consola.warn('DEVELOPMENT BUILD')
}

const timer = startTimer()

const emptyLine = () => console.log('\n------------\n')
await mkdir('dist/__app__/src', { recursive: true })

emptyLine()

// await buildCli(isDev)
// emptyLine()

await bundleApp()
emptyLine()

await buildWebcomponentBundle(isDev)
emptyLine()

await buildReact(isDev)
emptyLine()

timer.stopAndLog()
