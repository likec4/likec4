import { cp, mkdir } from 'node:fs/promises'
import { resolve } from 'path'
import { emptyDir } from './_utils'

const from = resolve('../react/dist/')
const to = resolve('./react/')

emptyDir(to)
await mkdir(to, { recursive: true })

console.info(`Copy @likec4/react`)
console.info(`  from: ${from}`)
console.info(`  to: ${to}`)

await cp(from, to, {
  recursive: true,
  force: true,
})
