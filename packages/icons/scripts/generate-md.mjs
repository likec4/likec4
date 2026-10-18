import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const source = new URL('./outlined/', import.meta.resolve('@material-symbols/svg-400/package.json'))
const output = new URL('../md/', import.meta.url)
const files = (await readdir(source)).filter((file) => file.endsWith('.svg')).sort()
if (files.length === 0) {
  throw new Error(`No Material Symbols found in ${fileURLToPath(source)}`)
}

await mkdir(output, { recursive: true })
const exports = []
const names = new Set()
const components = new Set()

for (const file of files) {
  const name = file.slice(0, -4).replaceAll('_', '-')
  const component = `Svg${name.replace(/(^|-)([a-z0-9])/g, (_, _separator, char) => char.toUpperCase())}`
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || names.has(name) || components.has(component)) {
    throw new Error(`Invalid or duplicate Material Symbol name: ${file}`)
  }
  names.add(name)
  components.add(component)

  const svg = (await readFile(new URL(file, source), 'utf8')).trim()
  const match = svg.match(
    /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="(\d+)" height="(\d+)" viewBox="([-.\d ]+)">((?:<path d="[^"]*"\/>)+)<\/svg>$/,
  )
  if (!match) {
    throw new Error(`Unsupported Material Symbol SVG structure: ${file}`)
  }
  const [, width, height, viewBox, paths] = match
  await writeFile(
    new URL(`${name}.tsx`, output),
    `import type { SVGProps } from 'react'

const ${component} = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" fill="currentColor" {...props}>
    ${paths}
  </svg>
)
export default ${component}
`,
  )
  exports.push(`export { default as ${component} } from './${name}'`)
}

await writeFile(new URL('index.ts', output), `${exports.join('\n')}\n`)
await copyFile(new URL('../LICENSE', source), new URL('../MATERIAL-SYMBOLS-LICENSE', import.meta.url))
console.info('Generated %s Material Symbols in %s', files.length, fileURLToPath(output))
