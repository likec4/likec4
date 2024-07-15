import consola from 'consola'
import { $, execa } from 'execa'
import { glob } from 'glob'
import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'

await rm('.tmp/src', { force: true, recursive: true })
await mkdir('.tmp/src', { recursive: true })

if (!existsSync('.tmp/tech.zip')) {
  consola.info('Fetching tech-icons...')
  await $`curl -o .tmp/tech.zip  https://icon.icepanel.io/Technology/svg.zip`
}
await $`unzip .tmp/tech.zip -d .tmp/src/tech`
consola.success('tech-icons - OK')

if (!existsSync('.tmp/gcp.zip')) {
  consola.info('Fetching gcp-icons...')
  await $`curl -o .tmp/gcp.zip  https://icon.icepanel.io/GCP/svg.zip`
}
await rm('.tmp/gcp', { force: true, recursive: true })
await $`unzip .tmp/gcp.zip  -d .tmp/gcp`
await $`mv .tmp/gcp/svg .tmp/src/gcp`
consola.success('gcp-icons - OK')

if (!existsSync('.tmp/aws.zip')) {
  consola.info('Fetching aws-icons...')
  await $`curl -o .tmp/aws.zip https://icon.icepanel.io/AWS/svg.zip`
}
await rm('.tmp/aws', { force: true, recursive: true })
await $`unzip .tmp/aws.zip -d .tmp/aws`
await mkdir('.tmp/src/aws', { recursive: true })

const svgs = await glob('.tmp/aws/**/*.svg')
for (const svg of svgs) {
  const name = svg.split('/').pop()
  await $`mv ${svg} .tmp/src/aws/${name}`
}
consola.success('aws-icons - OK')

await $`rm -r -f src/*`
const opts = [
  '--typescript',
  '--filename-case',
  'kebab',
  '--jsx-runtime',
  'automatic',
  '--svgo-config',
  'svgo.config.json'
]

await $`npx @svgr/cli ${opts} --out-dir src -- .tmp/src`
consola.success('generated svg tsx - DONE')

await $`rm -r -f .tmp/src .tmp/aws .tmp/gcp`
