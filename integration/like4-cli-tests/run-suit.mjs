/* eslint-disable */
import { $ } from 'execa'
import { rm } from 'fs/promises'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cwd = join(__dirname, '..', '..')
console.log(`__dirname: ${__dirname}`)
console.log(`cwd: ${cwd}`)

const $$ = $({
  stdio: 'inherit',
  timeout: 60000,
  cwd
});

await rm(resolve(__dirname, 'out'), { recursive: true, force: true })

const out = './integration/like4-cli-tests/out'
const workspace = './integration/like4-cli-tests/likec4'

await $$`packages/cli/bin/likec4 codegen react -o ${out}/react.tsx ${workspace}`;

await $$`packages/cli/bin/likec4 export --dry-run --script-cwd ${out} -o ${out} ${workspace}`;

// TODO: add test for export
