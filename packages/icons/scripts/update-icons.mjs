import consola from 'consola'
import { $, execa } from 'execa'
import { glob } from 'glob'
import { cp, mkdir, rm } from 'node:fs/promises'

consola.start('Fetching tech-icons...')
await rm('src/tech/', { force: true, recursive: true })
await rm('.tech', { force: true, recursive: true })
await $`curl -o icons.zip  https://icon.icepanel.io/Technology/svg.zip`
await $`unzip icons.zip -d .tech`
// await $`npx @svgr/cli --out-dir tech --filename-case kebab --typescript --jsx-runtime automatic -- .tech`
await $`npx @svgr/cli --out-dir src/tech  -- .tech`
await rm('.tech', { force: true, recursive: true })
consola.success('Done')

// const svgr = 'npx @svgr/cli --filename-case kebab --typescript --jsx-runtime automatic --svgo-config svgo.config.mjs'

// const opts = [
//   '--filename-case', 'kebab',
//   '--typescript',
//   '--jsx-runtime', 'automatic',
//   '--svgo-config', 'svgo.config.json',
// ]

consola.start('Fetching gcp-icons...')
await rm('src/gcp/', { force: true, recursive: true })
await rm('.gcp', { force: true, recursive: true })
await $`curl -o icons.zip  https://icon.icepanel.io/GCP/svg.zip`
await $`unzip icons.zip -d .gcp`
await $`npx @svgr/cli --out-dir src/gcp -- .gcp/svg`
await rm('.gcp', { force: true, recursive: true })
consola.success('Done')

consola.start('Fetching aws-icons...')
await rm('src/aws/', { force: true, recursive: true })
await rm('.aws', { force: true, recursive: true })
await rm('.aws-flat', { force: true, recursive: true })
await $`curl -o icons.zip  https://icon.icepanel.io/AWS/svg.zip`
await $`unzip icons.zip -d .aws`
await mkdir('.aws-flat', { recursive: true })

const svgs = await glob('.aws/**/*.svg')
for (const svg of svgs) {
  const name = svg.split('/').pop()
  await cp(svg, `.aws-flat/${name}`)
}

await $`npx @svgr/cli --out-dir src/aws -- .aws-flat`
await rm('.aws', { force: true, recursive: true })
await rm('.aws-flat', { force: true, recursive: true })
consola.success('Done')

await rm('icons.zip', { force: true })
