/* eslint-disable */
import { $ } from 'execa'
import { rm } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cwd = join(__dirname, '..', '..')
console.log(`__dirname: ${__dirname}`)
console.log(`cwd: ${cwd}`)

const $$ = $({
  stdio: 'inherit',
  timeout: 60000,
  cwd
})

await rm(resolve(__dirname, 'out'), { recursive: true, force: true })

const out = './integration/like4-cli-tests/out'
const workspace = './integration/like4-cli-tests/likec4'

await $$`node_modules/.bin/likec4 codegen react -o ${out}/react.tsx ${workspace}`

// TODO: add test for export
