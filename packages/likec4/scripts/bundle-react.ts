import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { fs } from 'zx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

const from = resolve(__dirname, '../../react/dist/')
const to = resolve(__dirname, '../react/')

console.info(`Copy @likec4/react`)
console.info(`from: ${from}`)
console.info(`to: ${to}`)

fs.cpSync(from, to, {
  recursive: true,
  force: true,
})

// Rename index.js to index.mjs
fs.renameSync(resolve(to, 'index.js'), resolve(to, 'index.mjs'))
