import { transform } from 'esbuild'
import { fdir } from 'fdir'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const ROOT = new URL('..', import.meta.url).pathname
const SVG_DIR = join(ROOT, 'svg')
const GROUPS = ['aws', 'azure', 'bootstrap', 'gcp', 'tech']

const files = new fdir()
  .withRelativePaths()
  .glob('**/*.tsx')
  .crawl(ROOT)
  .sync()
  .filter((f) => {
    const parts = f.split('/')
    return parts.length === 2 && GROUPS.includes(parts[0])
  })
  .sort()

console.info('Found %d icon components', files.length)

// Create output directories
await Promise.all(GROUPS.map((group) => mkdir(join(SVG_DIR, group), { recursive: true })))

let count = 0
const BATCH_SIZE = 50

for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE)
  await Promise.all(batch.map(async (file) => {
    const source = await readFile(join(ROOT, file), 'utf-8')

    const { code } = await transform(source, {
      loader: 'tsx',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      format: 'cjs',
    })

    const mod = { exports: {} }
    new Function('React', 'module', 'exports', 'require', code)(
      React,
      mod,
      mod.exports,
      () => {},
    )

    const Component = mod.exports.default || mod.exports
    const svg = renderToStaticMarkup(React.createElement(Component))

    const outFile = file.replace(/\.tsx$/, '.svg')
    await writeFile(join(SVG_DIR, outFile), svg + '\n')
  }))
  count += batch.length
  if (count % 500 === 0 || count === files.length) {
    console.info('Processed %d / %d', count, files.length)
  }
}

console.info('Prerendered %d SVG files to %s', count, SVG_DIR)
