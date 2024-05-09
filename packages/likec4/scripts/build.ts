import { startTimer } from '@/logger'
import { consola } from 'consola'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { buildCli } from './build-cli'
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
// consola.start('--- BUILD CLI ----')

await buildCli()

emptyLine()
// consola.start('--- BUNDLE APP----')

await bundleApp()

consola.info(`copy app files to dist/__app__`)
let indexHtml = await readFile('app/index.html', 'utf-8')
indexHtml = indexHtml.replace('%VITE_HTML_DEV_INJECT%', '')
await writeFile('dist/__app__/index.html', indexHtml)

await Promise.all([
  copyFile('app/robots.txt', 'dist/__app__/robots.txt'),
  copyFile('app/favicon.ico', 'dist/__app__/favicon.ico'),
  copyFile('app/favicon.svg', 'dist/__app__/favicon.svg'),
  copyFile('app/src/main.js', 'dist/__app__/src/main.js')
])

emptyLine()
// consola.info('--- BUNDLE WEBCOMPONENT----')

await buildWebcomponentBundle(isDev)

emptyLine()
// consola.info('--- BUNDLE REACT ----')

await buildReact(isDev)

emptyLine()

timer.stopAndLog()
